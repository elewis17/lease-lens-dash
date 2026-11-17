from pathlib import Path
import subprocess
import tempfile
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[1]


class WorkerWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.worker = yaml.safe_load((ROOT / '.github/workflows/coding-worker.yml').read_text())
        self.steps = self.worker['jobs']['worker']['steps']

    def test_generated_files_excluded_even_when_previously_tracked(self):
        pr = next(s for s in self.steps if s['name'] == 'Create Pull Request')
        paths = pr['with']['add-paths'].splitlines()
        with tempfile.TemporaryDirectory() as directory:
            def git(*args):
                return subprocess.check_output(['git', '-C', directory, *args], text=True).strip()
            git('init', '-q')
            git('config', 'user.name', 'Test')
            git('config', 'user.email', 'test@example.invalid')
            generated = ['runtime/runs/result.json', 'task/task.md', 'agent/task.md', 'ai-company-os/README.md', 'issue_outputs.txt']
            for name in generated:
                p = Path(directory) / name
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text('old')
            git('add', '.')
            git('commit', '-qm', 'baseline')
            for name in generated:
                (Path(directory) / name).write_text('changed')
            (Path(directory) / 'runtime/runs/new.json').write_text('new')
            p = Path(directory) / 'docs/note.md'
            p.parent.mkdir()
            p.write_text('requested change')
            git('add', '--', *paths)
            self.assertEqual(git('diff', '--cached', '--name-only'), 'docs/note.md')

    def test_code_gate_runs_tests_and_blocks_missing_or_failed_tests(self):
        gate = next(s for s in self.steps if s['name'] == 'Run automated code tests')
        names = [s['name'] for s in self.steps]
        self.assertLess(names.index('Run automated code tests'), names.index('Create Pull Request'))
        with tempfile.TemporaryDirectory() as directory:
            subprocess.run(['git', 'init', '-q', directory], check=True)
            root = Path(directory)
            (root / 'src').mkdir()
            (root / 'src/example.js').write_text('export const value = 1;')
            def run():
                return subprocess.run(['bash', '-e', '-c', gate['run']], cwd=root, capture_output=True).returncode
            self.assertNotEqual(run(), 0, 'source without tests must fail')
            (root / 'tests').mkdir()
            test = root / 'tests/example.test.mjs'
            test.write_text("import test from 'node:test'; test('deliberate failure', () => { throw Error('failure'); });")
            self.assertNotEqual(run(), 0, 'failing tests must prevent PR publication')
            test.write_text("import test from 'node:test'; test('pass', () => {});")
            self.assertEqual(run(), 0)

    def test_dispatch_packet_does_not_interpolate_issue_into_shell(self):
        dispatcher = yaml.safe_load((ROOT / '.github/workflows/dispatch-agent.yml').read_text())
        for step in dispatcher['jobs']['dispatch']['steps']:
            self.assertNotIn('${{ github.event.issue.title }}', step.get('run', ''))
            self.assertNotIn('${{ github.event.issue.body }}', step.get('run', ''))

    def test_blocked_work_cannot_reach_pr_creation(self):
        names = [s['name'] for s in self.steps]
        self.assertLess(names.index('Require successful QA'), names.index('Create Pull Request'))
        gate = next(s for s in self.steps if s['name'] == 'Require successful QA')
        self.assertNotIn('continue-on-error', gate)
        self.assertNotIn('if', gate)


if __name__ == '__main__':
    unittest.main()
