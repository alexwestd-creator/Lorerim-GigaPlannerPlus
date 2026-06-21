import { useRef, useState, type DragEvent, type MouseEvent, type ReactNode, type RefObject } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Archive,
  Copy,
  Download,
  GripVertical,
  Link2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { GameData } from "@/data/schemas";
import {
  decodeBuild,
  encodeBuild,
} from "@/engine/buildCodec";
import type { BuildState } from "@/engine/buildEngine";
import {
  buildBackupFilename,
  buildShareUrl,
  BUILD_BACKUP_EXTENSION,
  createExportedBuild,
  createExportedLibrary,
  downloadBackupFile,
  LIBRARY_BACKUP_FILENAME,
  parseExportedBuild,
  parseExportedLibrary,
  readBackupFile,
} from "@/lib/buildIO";
import { cn } from "@/lib/utils";
import { usePanelLabels, useThemeConfig } from "@/theme/ThemeProvider";
import { useBuildStore } from "@/store/buildStore";
import type { SavedBuild } from "@/store/savedBuilds";

function formatUpdatedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatLabel(template: string, values: Record<string, string | number>): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, String(value)),
    template,
  );
}

async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

function getBuildSummary(build: BuildState, game: GameData, labels: Record<string, string>) {
  const raceName =
    build.raceId && build.raceId !== "none"
      ? game.races.find((race) => race.id === build.raceId)?.name
      : null;

  return {
    raceLabel: raceName ?? labels.noRace,
    perkLabel: formatLabel(labels.perkCount, { count: build.selectedPerkIds.length }),
  };
}

function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}

function StatusBanner({ type, message }: { type: "success" | "error"; message: string }) {
  const Icon = type === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm",
        type === "success"
          ? "border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          : "border-[var(--color-health)]/40 bg-[var(--color-health)]/10 text-[var(--color-foreground)]",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function PanelHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Link2;
  title: string;
  description: string;
}) {
  return (
    <CardHeader className="pb-3">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="mt-1 text-xs leading-relaxed">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
      {children}
    </p>
  );
}

interface ActiveBuildCodeBlockProps {
  buildName: string | undefined;
  code: string;
  labels: Record<string, string>;
  copiedAction: "code" | "link" | null;
  onCopyCode: () => void;
  onCopyLink: () => void;
}

function ActiveBuildCodeBlock({
  buildName,
  code,
  labels,
  copiedAction,
  onCopyCode,
  onCopyLink,
}: ActiveBuildCodeBlockProps) {
  return (
    <div className="space-y-3">
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted)]">
          {labels.activeBuildCode}
        </p>
        <p className="mt-1 truncate font-medium text-[var(--color-foreground)]">
          {buildName ?? labels.unnamedBuild}
        </p>
      </div>

      <button
        type="button"
        onClick={onCopyCode}
        className="group flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 px-3 py-2 text-left transition-colors hover:border-[var(--color-accent-muted)]"
      >
        <code className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs text-[var(--color-accent)]">
          {code}
        </code>
        <Copy className="h-4 w-4 shrink-0 text-[var(--color-muted)] group-hover:text-[var(--color-accent)]" />
      </button>

      <Button variant="outline" size="sm" className="w-full" onClick={onCopyLink}>
        <Link2 className="h-3.5 w-3.5" />
        {copiedAction === "link" ? labels.copiedLink : labels.copyLink}
      </Button>
    </div>
  );
}

interface TransferSidebarProps {
  labels: Record<string, string>;
  activeBuildName: string | undefined;
  activeBuildCode: string;
  codeInput: string;
  onCodeInputChange: (value: string) => void;
  onImportCode: (replaceActive: boolean) => void;
  onCopyActiveCode: () => void;
  onCopyActiveLink: () => void;
  activeCodeCopied: "code" | "link" | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  fileDragOver: boolean;
  onFileDragOver: (event: DragEvent<HTMLButtonElement>) => void;
  onFileDragLeave: () => void;
  onFileDrop: (event: DragEvent<HTMLButtonElement>) => void;
  onFileSelect: (file: File) => void;
  onExportActive: () => void;
  onExportLibrary: () => void;
}

function TransferSidebar({
  labels,
  activeBuildName,
  activeBuildCode,
  codeInput,
  onCodeInputChange,
  onImportCode,
  onCopyActiveCode,
  onCopyActiveLink,
  activeCodeCopied,
  fileInputRef,
  fileDragOver,
  onFileDragOver,
  onFileDragLeave,
  onFileDrop,
  onFileSelect,
  onExportActive,
  onExportLibrary,
}: TransferSidebarProps) {
  return (
    <div className="space-y-4">
      <Card>
        <PanelHeader
          icon={Link2}
          title={labels.shareCodeTitle}
          description={labels.shareCodeDescription}
        />
        <CardContent className="space-y-4">
          <ActiveBuildCodeBlock
            buildName={activeBuildName}
            code={activeBuildCode}
            labels={labels}
            copiedAction={activeCodeCopied}
            onCopyCode={onCopyActiveCode}
            onCopyLink={onCopyActiveLink}
          />

          <div className="space-y-2 border-t border-[var(--color-border)]/60 pt-4">
            <SectionLabel>{labels.importCodeTitle}</SectionLabel>
            <textarea
              id="import-code"
              value={codeInput}
              onChange={(e) => onCodeInputChange(e.target.value)}
              placeholder={labels.importCodePlaceholder}
              rows={3}
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 px-3 py-2 font-mono text-xs text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!codeInput.trim()}
                onClick={() => onImportCode(false)}
              >
                {labels.importAsNew}
              </Button>
              <Button size="sm" disabled={!codeInput.trim()} onClick={() => onImportCode(true)}>
                {labels.importToActive}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <PanelHeader
          icon={Archive}
          title={labels.backupTitle}
          description={formatLabel(labels.backupDescription, { extension: labels.backupExtension })}
        />
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <SectionLabel>{labels.backupImportTitle}</SectionLabel>
            <input
              ref={fileInputRef}
              type="file"
              accept={`${BUILD_BACKUP_EXTENSION},.json,application/json`}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={onFileDragOver}
              onDragLeave={onFileDragLeave}
              onDrop={onFileDrop}
              className={cn(
                "flex w-full flex-col items-center gap-1.5 rounded-[var(--radius-md)] border border-dashed px-3 py-4 text-center transition-colors",
                fileDragOver
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-foreground)]"
                  : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent-muted)] hover:text-[var(--color-foreground)]",
              )}
            >
              <Archive className="h-5 w-5 shrink-0 text-[var(--color-accent-muted)]" />
              <span className="text-sm">{labels.chooseBackupFile}</span>
              <span className="text-xs text-[var(--color-muted)]">{labels.backupExtension}</span>
            </button>
          </div>

          <div className="space-y-2 border-t border-[var(--color-border)]/60 pt-4">
            <SectionLabel>{labels.backupExportTitle}</SectionLabel>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={onExportActive}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/40 px-3 py-2.5 text-left transition-colors hover:border-[var(--color-accent-muted)] hover:bg-[var(--color-surface-elevated)]"
              >
                <Download className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                <span className="text-sm text-[var(--color-foreground)]">{labels.exportActive}</span>
              </button>
              <button
                type="button"
                onClick={onExportLibrary}
                className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/40 px-3 py-2.5 text-left transition-colors hover:border-[var(--color-accent-muted)] hover:bg-[var(--color-surface-elevated)]"
              >
                <Download className="h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                <span className="text-sm text-[var(--color-foreground)]">{labels.exportAll}</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SavedBuildCardProps {
  index: number;
  entry: SavedBuild;
  isActive: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  labels: Record<string, string>;
  game: GameData;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverItem: () => void;
  onDropItem: (fromIndex: number) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function SavedBuildCard({
  index,
  entry,
  isActive,
  isDragging,
  isDragOver,
  labels,
  game,
  onSelect,
  onDragStart,
  onDragEnd,
  onDragOverItem,
  onDropItem,
  onRename,
  onDelete,
  canDelete,
}: SavedBuildCardProps) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(entry.name);
  const summary = getBuildSummary(entry.build, game, labels);

  const startEditing = (event: MouseEvent) => {
    stopPropagation(event);
    setDraftName(entry.name);
    setEditing(true);
  };

  const commitRename = () => {
    onRename(draftName);
    setEditing(false);
  };

  const cancelEditing = () => {
    setDraftName(entry.name);
    setEditing(false);
  };

  const handleDelete = (event: MouseEvent) => {
    stopPropagation(event);
    onDelete();
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
    onDragStart();
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDragOverItem();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(fromIndex)) {
      onDropItem(fromIndex);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        "relative flex overflow-hidden rounded-[var(--radius-lg)] border text-left transition-all",
        isDragging && "opacity-40",
        isDragOver && "border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/40",
        !isDragging && !isDragOver && (isActive
          ? "border-[var(--color-accent)]/60 bg-[var(--color-accent)]/[0.07] shadow-[var(--shadow-glow)]"
          : "border-[var(--color-border)]/80 bg-[var(--color-surface-elevated)]/40 hover:border-[var(--color-accent-muted)]/60 hover:bg-[var(--color-surface-elevated)]/70"),
      )}
    >
      {isActive && (
        <div className="absolute inset-y-0 left-0 w-1 bg-[var(--color-accent)]" aria-hidden />
      )}

      <div
        role="button"
        tabIndex={editing ? -1 : 0}
        draggable={!editing}
        aria-label={labels.dragToReorder}
        onDragStart={handleDragStart}
        onDragEnd={(event) => {
          event.stopPropagation();
          onDragEnd();
        }}
        onClick={stopPropagation}
        className="flex shrink-0 cursor-grab touch-none items-center self-stretch border-r border-[var(--color-border)]/50 px-2.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      <div
        role="button"
        tabIndex={editing ? -1 : 0}
        onClick={editing ? undefined : onSelect}
        onKeyDown={(event) => {
          if (editing || event.key !== "Enter") return;
          onSelect();
        }}
        className={cn(
          "min-w-0 flex-1 p-4 outline-none",
          editing ? "cursor-default" : "cursor-pointer",
        )}
      >
        {editing ? (
          <div className="flex items-center gap-2" onClick={stopPropagation}>
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") cancelEditing();
              }}
              className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              autoFocus
            />
            <Button variant="ghost" size="icon" onClick={commitRename} aria-label={labels.saveRename}>
              <Check className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={cancelEditing} aria-label={labels.cancelRename}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate font-medium text-[var(--color-foreground)]">{entry.name}</h3>
                {isActive && (
                  <span className="shrink-0 rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-accent)]">
                    {labels.activeBadge}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-[var(--color-muted)]">
                {summary.raceLabel} · {summary.perkLabel} · {formatUpdatedAt(entry.updatedAt)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-0.5" onClick={stopPropagation}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={startEditing}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{labels.renameBuild}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDelete} disabled={!canDelete}>
                    <Trash2 className="h-3.5 w-3.5 text-[var(--color-health)]" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{labels.deleteBuild}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BuildsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { labels: allLabels } = useThemeConfig();
  const labels = usePanelLabels("build-library");
  const gameData = useBuildStore((s) => s.gameData);
  const build = useBuildStore((s) => s.build);
  const savedBuilds = useBuildStore((s) => s.savedBuilds);
  const activeBuildId = useBuildStore((s) => s.activeBuildId);
  const createSavedBuildSlot = useBuildStore((s) => s.createSavedBuildSlot);
  const deleteSavedBuildSlot = useBuildStore((s) => s.deleteSavedBuildSlot);
  const renameSavedBuildSlot = useBuildStore((s) => s.renameSavedBuildSlot);
  const selectSavedBuildSlot = useBuildStore((s) => s.selectSavedBuildSlot);
  const loadBuild = useBuildStore((s) => s.loadBuild);
  const importBuildAsSlot = useBuildStore((s) => s.importBuildAsSlot);
  const importBuildLibrary = useBuildStore((s) => s.importBuildLibrary);
  const reorderSavedBuildSlot = useBuildStore((s) => s.reorderSavedBuildSlot);

  const [codeInput, setCodeInput] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [fileDragOver, setFileDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [activeCodeCopied, setActiveCodeCopied] = useState<"code" | "link" | null>(null);

  if (!gameData) return null;

  const modpackVersion = gameData.game.manifest.version;
  const activeBuild = savedBuilds.find((entry) => entry.id === activeBuildId);
  const activeBuildCode = encodeBuild(build, gameData.game);

  const showSuccess = (message: string) => {
    setImportSuccess(message);
    setImportError(null);
    setTimeout(() => setImportSuccess(null), 4000);
  };

  const handleImportCode = (replaceActive: boolean) => {
    try {
      const decoded = decodeBuild(codeInput.trim(), gameData.game);
      if (replaceActive) {
        loadBuild(decoded);
        showSuccess(labels.importedToActive);
      } else {
        importBuildAsSlot(decoded);
        showSuccess(labels.importedAsNew);
      }
      setCodeInput("");
    } catch {
      setImportError(allLabels.errors.invalidBuildCode);
      setImportSuccess(null);
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const data = await readBackupFile(file);
      const record = data as Record<string, unknown>;

      if (record.format === "lorerim-build-library") {
        const library = parseExportedLibrary(data);
        if (library.savedBuilds.length === 0) {
          throw new Error(labels.importEmptyLibrary);
        }
        importBuildLibrary(library.savedBuilds);
        showSuccess(labels.importedLibrary);
      } else {
        const exported = parseExportedBuild(data);
        importBuildAsSlot(exported.build, exported.name);
        showSuccess(labels.importedAsNew);
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : allLabels.errors.invalidBuildCode);
      setImportSuccess(null);
    }
  };

  const handleFileDrop = (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setFileDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) void handleImportFile(file);
  };

  const handleBuildDrop = (fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      reorderSavedBuildSlot(fromIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const clearBuildDrag = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleExportLibrary = () => {
    downloadBackupFile(LIBRARY_BACKUP_FILENAME, createExportedLibrary(savedBuilds, modpackVersion));
  };

  const handleExportActive = () => {
    const name = activeBuild?.name ?? "build";
    downloadBackupFile(
      buildBackupFilename(name),
      createExportedBuild(name, build, modpackVersion),
    );
  };

  const flashActiveCopy = (action: "code" | "link") => {
    setActiveCodeCopied(action);
    setTimeout(() => setActiveCodeCopied(null), 2000);
  };

  const handleCopyActiveCode = async () => {
    await copyText(activeBuildCode);
    flashActiveCopy("code");
  };

  const handleCopyActiveLink = async () => {
    await copyText(buildShareUrl(activeBuildCode));
    flashActiveCopy("link");
  };

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--color-accent-muted)]">
            {labels.eyebrow}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold tracking-wide text-[var(--color-foreground)]">
            {labels.title}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            {formatLabel(labels.buildCount, { count: savedBuilds.length })} · {labels.autoSaveHint}
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 self-start">
          <Link to="/planner">
            {labels.openPlanner}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <section className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-[var(--color-accent)]">
              {labels.savedBuildsTitle}
            </h2>
            <Button variant="outline" size="sm" onClick={() => createSavedBuildSlot()}>
              <Plus className="h-4 w-4" />
              {labels.newBuild}
            </Button>
          </div>

          <div className="space-y-2">
            {savedBuilds.map((entry, index) => (
              <SavedBuildCard
                key={entry.id}
                index={index}
                entry={entry}
                isActive={entry.id === activeBuildId}
                isDragging={draggedIndex === index}
                isDragOver={dragOverIndex === index && draggedIndex !== index}
                labels={labels}
                game={gameData.game}
                onSelect={() => selectSavedBuildSlot(entry.id)}
                onDragStart={() => setDraggedIndex(index)}
                onDragEnd={clearBuildDrag}
                onDragOverItem={() => setDragOverIndex(index)}
                onDropItem={(fromIndex) => handleBuildDrop(fromIndex, index)}
                onRename={(name) => renameSavedBuildSlot(entry.id, name)}
                onDelete={() => deleteSavedBuildSlot(entry.id)}
                canDelete={savedBuilds.length > 1}
              />
            ))}
          </div>
        </section>

        <aside className="lg:sticky lg:top-6">
          {(importSuccess || importError) && (
            <div className="mb-4 space-y-2">
              {importSuccess && <StatusBanner type="success" message={importSuccess} />}
              {importError && <StatusBanner type="error" message={importError} />}
            </div>
          )}

          <TransferSidebar
            labels={labels}
            activeBuildName={activeBuild?.name}
            activeBuildCode={activeBuildCode}
            codeInput={codeInput}
            onCodeInputChange={setCodeInput}
            onImportCode={handleImportCode}
            onCopyActiveCode={handleCopyActiveCode}
            onCopyActiveLink={handleCopyActiveLink}
            activeCodeCopied={activeCodeCopied}
            fileInputRef={fileInputRef}
            fileDragOver={fileDragOver}
            onFileDragOver={(e) => {
              e.preventDefault();
              setFileDragOver(true);
            }}
            onFileDragLeave={() => setFileDragOver(false)}
            onFileDrop={handleFileDrop}
            onFileSelect={(file) => void handleImportFile(file)}
            onExportActive={handleExportActive}
            onExportLibrary={handleExportLibrary}
          />
        </aside>
      </div>
    </div>
  );
}
