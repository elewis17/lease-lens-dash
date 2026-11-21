import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  acceptedLeaseFiles, leaseFileMaxBytes, leaseReviewSchema, type LeaseCapture,
} from "./leaseCapture";
import { extractLease, saveCapturedLease } from "./leaseCaptureApi";

type Props = {
  ownerId: string;
  properties: { id: string; name: string }[];
  selectedProperty: string;
  onUploadComplete: () => void | Promise<void>;
  onOpen: () => void;
};

const fields = [
  { key: "tenantName", label: "Tenant name", type: "text", required: true },
  { key: "unitLabel", label: "Unit", type: "text", required: true },
  { key: "startDate", label: "Lease start", type: "date", required: true },
  { key: "endDate", label: "Lease end", type: "date", required: true },
  { key: "monthlyRent", label: "Monthly rent ($)", type: "number", required: true },
  { key: "deposit", label: "Deposit ($)", type: "number" },
  { key: "lateFee", label: "Late fee ($)", type: "number" },
  { key: "graceDays", label: "Grace period (days)", type: "number" },
  { key: "noticeDays", label: "Notice (days)", type: "number" },
] as const;

export function LeaseUploader({ ownerId, properties, selectedProperty, onUploadComplete, onOpen }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const formId = useId();
  const [capture, setCapture] = useState<LeaseCapture | null>(null);
  const [status, setStatus] = useState<"reading" | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (capture) titleRef.current?.focus();
  }, [capture]);

  const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : "Something went wrong. Try again.";

  const changeOpen = (next: boolean) => {
    if (activeRequest.current) return;
    setCapture(null);
    setError(null);
    setIsOpen(next);
    if (next) onOpen();
  };

  const read = async (files: File[]) => {
    const file = files[0];
    if (!file || activeRequest.current) return;
    activeRequest.current = true;
    setStatus("reading");
    setError(null);
    try {
      setCapture(await extractLease(file, ownerId));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      activeRequest.current = false;
      setStatus(null);
    }
  };

  const { getRootProps, getInputProps, open } = useDropzone({
    onDropAccepted: read,
    onDropRejected: () => setError("Choose one PDF, JPEG, PNG, or WebP file of up to 8 MB."),
    accept: Object.fromEntries(Object.entries(acceptedLeaseFiles).map(([type, extension]) => [type, [`.${extension}`]])),
    multiple: false,
    maxSize: leaseFileMaxBytes,
    disabled: status !== null,
    noClick: true,
    noKeyboard: true,
  });

  const confirm = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!capture || activeRequest.current) return;
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const review = leaseReviewSchema.safeParse(values);
    if (!review.success) {
      const issue = review.error.issues[0];
      const label = fields.find(field => field.key === issue.path[0])?.label;
      setError(label ? `${label} — ${issue.message}` : issue.message);
      return;
    }
    if (!properties.some(property => property.id === review.data.propertyId)) {
      setError("Select a property from this portfolio.");
      return;
    }
    activeRequest.current = true;
    setStatus("saving");
    setError(null);
    try {
      await saveCapturedLease(capture, review.data, ownerId);
    } catch (cause) {
      setError(errorMessage(cause));
      return;
    } finally {
      activeRequest.current = false;
      setStatus(null);
    }
    changeOpen(false);
    await onUploadComplete();
  };

  return (
    <Sheet open={isOpen} onOpenChange={changeOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" disabled={!properties.length}
          className="fixed inset-x-4 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 min-h-11 lg:static">
          Upload lease
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" hideClose
        className="mx-auto flex max-h-[min(90dvh,48rem)] max-w-2xl flex-col gap-0 border p-0">
        <header className="space-y-1 border-b px-4 py-4 sm:px-6">
          <SheetTitle ref={titleRef} tabIndex={-1}>{capture ? "Review extracted lease fields" : "Upload lease"}</SheetTitle>
          <SheetDescription>Review the extracted fields before saving to your portfolio.</SheetDescription>
        </header>
        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6">
          {status && <p role="status" className="text-sm">{status === "reading" ? "Reading document…" : "Saving confirmed lease…"}</p>}
          {!capture ? (
            <div {...getRootProps({ className: "space-y-3" })}>
              <input {...getInputProps({ "aria-label": "Lease document" })} />
              <p className="text-sm text-muted-foreground">Drop a PDF or a JPEG, PNG, or WebP photo here, or choose a file up to 8 MB.</p>
              <p className="text-sm text-muted-foreground">The document is sent to the extraction provider.</p>
            </div>
          ) : (
            <form id={formId} onSubmit={confirm} className="space-y-4" noValidate>
              <p className="text-sm text-muted-foreground">Review the fields against {capture.file.name}. Confidence scores are extraction estimates.</p>
              {capture.extracted.fields.propertyAddress && <p className="text-sm">Extracted address · {capture.extracted.fields.propertyAddress}</p>}
              <fieldset disabled={status !== null} className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm">
                  <span>Property</span>
                  <select name="propertyId" defaultValue={selectedProperty} required className="w-full rounded-md border bg-background p-2">
                    <option value="">Select a property</option>
                    {properties.map(property => <option value={property.id} key={property.id}>{property.name}</option>)}
                  </select>
                </label>
                {fields.map(field => {
                  const confidence = capture.extracted.confidence[field.key];
                  return (
                    <label className="space-y-1 text-sm" key={field.key}>
                      <span>{field.label}</span>
                      <Input name={field.key} type={field.type} required={"required" in field} step={field.type === "number" ? "any" : undefined}
                        defaultValue={capture.extracted.fields[field.key] ?? ""} />
                      <span className="block text-xs text-muted-foreground">
                        {confidence == null ? "Extraction confidence unavailable" : `Extraction confidence ${Math.round(confidence * 100)}%`}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            </form>
          )}
        </div>
        <footer className="shrink-0 space-y-2 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-[auto_1fr] gap-2 sm:flex sm:justify-end">
            <Button type="button" variant="ghost" className="min-h-11" onClick={() => changeOpen(false)} disabled={status !== null}>Cancel</Button>
            {capture
              ? <Button type="submit" form={formId} className="min-h-11" disabled={status !== null}>Confirm and save lease</Button>
              : <Button type="button" className="min-h-11" onClick={open} disabled={status !== null}>Choose file</Button>}
          </div>
        </footer>
      </SheetContent>
    </Sheet>
  );
}
