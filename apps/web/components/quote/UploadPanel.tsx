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
        help="Televersez le ZIP de production exporte depuis votre outil PCB. Les fichiers sont stockes de facon privee et prepares pour validation."
        accept=".zip,application/zip"
        fileName={gerberFileName}
        onFile={onGerber}
        required
      />
      <FileDrop
        label="Fichier BOM"
        help="Liste des composants utilisee pour les demandes PCBA. Requise seulement si l'assemblage est active."
        accept=".csv,.xlsx,.xls"
        fileName={bomFileName}
        onFile={onBom}
      />
      <FileDrop
        label="Fichier CPL"
        help="Fichier de placement des composants utilise par les partenaires d'assemblage externes."
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
          <span className="mt-1 block text-xs text-slate-500">Televersement prive, analyse prete pour la production</span>
        </span>
      </span>
    </label>
  );
}
