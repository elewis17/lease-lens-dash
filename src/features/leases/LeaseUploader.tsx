import { useRef, useState, type FormEvent } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  onClose: () => void;
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

export function LeaseUploader({ ownerId, properties, selectedProperty, onUploadComplete, onClose }: Props) {
  const [capture, setCapture] = useState<LeaseCapture | null>(null);
  const [status, setStatus] = useState<"reading" | "saving" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef(false);
  const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : "Something went wrong. Try again.";

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
    await onUploadComplete();
  };

  return (
    <Card className="space-y-4 p-5 shadow-none">
      <h3 className="font-semibold">{capture ? "Review extracted lease fields" : "Upload lease"}</h3>
      {status && <p role="status" className="text-sm">{status === "reading" ? "Reading document…" : "Saving confirmed lease…"}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!capture ? (
        <div {...getRootProps({ className: "space-y-3" })}>
          <input {...getInputProps({ "aria-label": "Lease document" })} />
          <p className="text-sm text-muted-foreground">Drop a PDF or a JPEG, PNG, or WebP photo here, or choose a file up to 8 MB.</p>
          <p className="text-sm text-muted-foreground">The document is sent to the extraction provider. Review the result before you save it to your portfolio.</p>
          <Button type="button" variant="outline" onClick={open} disabled={status !== null}>Choose file</Button>
        </div>
      ) : (
        <form onSubmit={confirm} className="space-y-4" noValidate>
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
          <Button type="submit" disabled={status !== null}>Confirm and save lease</Button>
        </form>
      )}
      <Button type="button" variant="ghost" onClick={onClose} disabled={status !== null}>Cancel</Button>
    </Card>
  );
}
