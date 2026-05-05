'use client';

import { FieldLabel } from './FormControls';

export function UploadPanel({
  gerberFileName,
  bomFileName,
  cplFileName,
  onGerber,
  onBom,
  onCpl,
}: {
  gerberFileName?: string;
  bomFileName?: string;
  cplFileName?: string;
  onGerber: (name: string) => void;
  onBom: (name: string) => void;
  onCpl: (name: string) => void;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <FileDrop
        label="Gerber ZIP"
        help="Téléversez le ZIP de production exporté depuis votre outil PCB. Les fichiers sont stockés de façon privée et préparés pour validation."
        accept=".zip,application/zip"
        fileName={gerberFileName}
        onFile={onGerber}
        required
      />
      <FileDrop
        label="Fichier BOM"
        help="Liste des composants utilisée pour les demandes PCBA. Requise seulement si l’assemblage est activé."
        accept=".csv,.xlsx,.xls"
        fileName={bomFileName}
        onFile={onBom}
      />
      <FileDrop
        label="Fichier CPL"
        help="Fichier de placement des composants utilisé par les partenaires d’assemblage externes."
        accept=".csv,.xlsx,.xls"
        fileName={cplFileName}
        onFile={onCpl}
      />
    </div>
  );
}

function FileDrop({
  label,
  help,
  accept,
  fileName,
  onFile,
  required = false,
}: {
  label: string;
  help: string;
  accept: string;
  fileName?: string;
  onFile: (name: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block rounded-lg border border-dashed border-signal/35 bg-cloud/70 p-4 transition hover:border-signal hover:bg-white">
      <FieldLabel label={label} help={help} />
      <input
        type="file"
        accept={accept}
        required={required}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file.name);
        }}
      />
      <span className="grid min-h-28 place-items-center rounded-[10px] border border-line bg-white px-4 text-center">
        <span>
          <span className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-r from-signal to-electric text-lg font-black text-white">+</span>
          <span className="block text-sm font-black text-ink">{fileName ?? 'Ajouter un fichier'}</span>
          <span className="mt-1 block text-xs text-slate-500">Upload privé, analyse prête production</span>
        </span>
      </span>
    </label>
  );
}
