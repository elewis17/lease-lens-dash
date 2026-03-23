import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import emptyStateImage from "@/assets/upload-empty-state.jpg";

interface LeaseUploaderProps {
  onUploadComplete: () => void;
}

export const LeaseUploader = ({ onUploadComplete }: LeaseUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        
        const { data, error } = await supabase.functions.invoke('parse-lease', {
          body: { text }
        });

        if (error) {
          throw error;
        }

        toast({
          title: "Success!",
          description: `Lease for ${data.tenantName} uploaded and parsed successfully.`,
        });

        onUploadComplete();
        setIsUploading(false);
      };

      reader.readAsText(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "There was an error processing your lease document.",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  }, [toast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <Card 
      {...getRootProps()} 
      className={`p-12 border-2 border-dashed cursor-pointer transition-all hover:shadow-lg ${
        isDragActive ? 'border-primary bg-primary-light' : 'border-border'
      } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          {isUploading ? (
            <Loader2 className="h-16 w-16 text-primary animate-spin" />
          ) : (
            <div className="relative">
              <img 
                src={emptyStateImage} 
                alt="Upload document" 
                className="w-64 h-auto rounded-lg opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-background/90 rounded-full p-4">
                  <Upload className="h-12 w-12 text-primary" />
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">
            {isUploading ? "Processing your lease..." : "Upload Lease Document"}
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {isDragActive 
              ? "Drop your lease here..." 
              : "Drag & drop a PDF or Word document, or click to browse"}
          </p>
        </div>

        {!isUploading && (
          <Button size="lg" variant="outline" className="mt-4">
            <FileText className="mr-2 h-5 w-5" />
            Select File
          </Button>
        )}
      </div>
    </Card>
  );
};
