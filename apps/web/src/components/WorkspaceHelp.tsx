"use client";
import { useState } from "react";
import { Button, Modal } from "./ui";

export function WorkspaceHelp() {
  const [open, setOpen] = useState(false);
  return <>
    <Button variant="secondary" onClick={() => setOpen(true)}>About this workspace</Button>
    <Modal isOpen={open} onClose={() => setOpen(false)} title="About this workspace">
      <p>Navigation and sign-in presentation are available. Appointments, patient records and team information will appear only when the corresponding NestJS APIs are connected.</p>
      <p className="cd-muted mt-3">No sample clinical records or simulated sign-in are used.</p>
    </Modal>
  </>;
}
