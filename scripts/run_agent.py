import sys
from openai import OpenAI

client = OpenAI()

task_file = sys.argv[1]

with open(task_file) as f:
    task = f.read()

prompt = f"""
You are a senior software engineer.

Complete the task described below.

{task}

Return the code changes required.
"""

response = client.responses.create(
    model="gpt-4.1",
    input=prompt
)

print(response.output_text)
