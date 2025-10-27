"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Plus, Copy, ClipboardPaste, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";

// Типы данных
type Decomposition = {
  id: string;
  description: string;
  typeOfWork: string;
  difficulty: string;
  responsible: string;
  plannedHours: number;
  progress: number;
  status: string;
  completionDate: string;
};

type Stage = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  decompositions: Decomposition[];
};

// Опции для выпадающих списков
const TYPE_OF_WORK_OPTIONS = ["Аналитика", "Проектирование", "Разработка", "Тестирование", "Документация"];
const DIFFICULTY_OPTIONS = ["Низкая", "Средняя", "Высокая"];
const STATUS_OPTIONS = ["Не начато", "В работе", "Завершено", "Приостановлено"];
const RESPONSIBLE_OPTIONS = ["Иванов И.И.", "Петров П.П.", "Сидоров С.С.", "Козлов К.К.", "Смирнов С.М."];

// Моковые данные
const initialStages: Stage[] = [
  {
    id: "1",
    name: "Подготовительный этап",
    startDate: "2024-01-01",
    endDate: "2024-01-31",
    decompositions: [
      {
        id: "1-1",
        description: "Анализ требований",
        typeOfWork: "Аналитика",
        difficulty: "Средняя",
        responsible: "Иванов И.И.",
        plannedHours: 40,
        progress: 100,
        status: "Завершено",
        completionDate: "2024-01-15",
      },
      {
        id: "1-2",
        description: "Проектирование архитектуры",
        typeOfWork: "Проектирование",
        difficulty: "Высокая",
        responsible: "Петров П.П.",
        plannedHours: 60,
        progress: 80,
        status: "В работе",
        completionDate: "2024-01-25",
      },
    ],
  },
  {
    id: "2",
    name: "Разработка",
    startDate: "2024-02-01",
    endDate: "2024-03-31",
    decompositions: [
      {
        id: "2-1",
        description: "Разработка бэкенда",
        typeOfWork: "Разработка",
        difficulty: "Высокая",
        responsible: "Сидоров С.С.",
        plannedHours: 120,
        progress: 50,
        status: "В работе",
        completionDate: "2024-03-15",
      },
      {
        id: "2-2",
        description: "Разработка фронтенда",
        typeOfWork: "Разработка",
        difficulty: "Средняя",
        responsible: "Козлов К.К.",
        plannedHours: 100,
        progress: 30,
        status: "В работе",
        completionDate: "2024-03-20",
      },
    ],
  },
];

const formatDateDisplay = (iso?: string) => {
  if (!iso) return "";
  const parts = iso.split("-");
  if (parts.length !== 3) return iso;
  const [y, m, d] = parts;
  return `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${y}`;
};

const getDifficultyColor = (difficulty: string) => {
  const colors: Record<string, string> = {
    Низкая: "bg-emerald-100 hover:bg-emerald-200 text-emerald-900",
    Средняя: "bg-amber-100 hover:bg-amber-200 text-amber-900",
    Высокая: "bg-rose-100 hover:bg-rose-200 text-rose-900",
  };
  return colors[difficulty] || "bg-muted/60 hover:bg-muted/80";
};

const getProgressColor = (progress: number) => {
  if (progress === 0) return "bg-gray-100 hover:bg-gray-200 text-gray-900";
  if (progress <= 30) return "bg-red-100 hover:bg-red-200 text-red-900";
  if (progress <= 70) return "bg-yellow-100 hover:bg-yellow-200 text-yellow-900";
  return "bg-green-100 hover:bg-green-200 text-green-900";
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    "Не начато": "bg-slate-100 hover:bg-slate-200 text-slate-900",
    "В работе": "bg-sky-100 hover:bg-sky-200 text-sky-900",
    Завершено: "bg-emerald-100 hover:bg-emerald-200 text-emerald-900",
    Приостановлено: "bg-orange-100 hover:bg-orange-200 text-orange-900",
  };
  return colors[status] || "bg-muted/60 hover:bg-muted/80";
};

function SortableStage({
  stage,
  selectedStages,
  selectedDecompositions,
  toggleStageSelection,
  toggleDecompositionSelection,
  deleteStage,
  deleteDecomposition,
  addDecomposition,
  updateStage,
  updateDecomposition,
  onDecompositionDragEnd,
  focusedDecompositionId,
  pendingNewDecompositionId,
  onDecompositionInteract,
}: {
  stage: Stage;
  selectedStages: Set<string>;
  selectedDecompositions: Set<string>;
  toggleStageSelection: (id: string) => void;
  toggleDecompositionSelection: (id: string) => void;
  deleteStage: (id: string) => void;
  deleteDecomposition: (stageId: string, decompId: string) => void;
  addDecomposition: (stageId: string, opts?: { pending?: boolean }) => void;
  updateStage: (stageId: string, updates: Partial<Stage>) => void;
  updateDecomposition: (stageId: string, decompId: string, updates: Partial<Decomposition>) => void;
  onDecompositionDragEnd: (stageId: string, event: DragEndEvent) => void;
  focusedDecompositionId: string | null;
  pendingNewDecompositionId: string | null;
  onDecompositionInteract: (decompId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const copyStage = async () => {
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 200);

    try {
      let stageData = `Этап: ${stage.name}\nДата начала: ${stage.startDate}\nДата завершения: ${stage.endDate}\n\n`;
      stageData += "Декомпозиции:\n";
      stageData += "| Описание | Тип работ | Сложность | Ответственный | Часы | Прогресс | Статус | Дата |\n";
      stageData += "|---|---|---|---|---|---|---|---|\n";

      stage.decompositions.forEach((decomp) => {
        stageData += `| ${decomp.description} | ${decomp.typeOfWork} | ${decomp.difficulty} | ${decomp.responsible} | ${decomp.plannedHours} | ${decomp.progress}% | ${decomp.status} | ${decomp.completionDate} |\n`;
      });

      await navigator.clipboard.writeText(stageData);

      toast({
        title: "Успешно",
        description: "Этап скопирован в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать этап",
        variant: "destructive",
      });
    }
  };

  return (
    <Card ref={setNodeRef} style={style} className="p-3 shadow-sm border-border/40">
      <div className="mb-2 flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-40 hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-6 w-5 text-muted-foreground" />
        </div>
        <input
          type="checkbox"
          checked={selectedStages.has(stage.id)}
          onChange={() => toggleStageSelection(stage.id)}
          className="h-4 w-4 rounded"
        />
        <div className="flex-1">
          <input
            type="text"
            value={stage.name}
            onChange={(e) => updateStage(stage.id, { name: (e.target as HTMLInputElement).value })}
            className="text-lg font-semibold bg-transparent border-none outline-none px-3 py-1 rounded-none focus:ring-0 focus:bg-transparent transition-colors"
          />
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground/70">
          <span>{formatDateDisplay(stage.startDate)}</span>
          <span className="text-muted-foreground/40">→</span>
          <span>{formatDateDisplay(stage.endDate)}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyStage}
          className={`h-8 px-3 hover:bg-primary/10 transition-all active:scale-95 ${isCopying ? "scale-95" : ""}`}
        >
          <Copy className="h-4 w-4 mr-1.5" />
          Копировать
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteStage(stage.id)}
          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>


      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => onDecompositionDragEnd(stage.id, event)}
      >
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30">
                <th className="w-8 pb-2 pt-0"></th>
                <th className="w-8 pb-2 pt-0"></th>
                <th className="pb-2 pt-0 px-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Описание
                </th>
                <th className="pb-2 pt-0 px-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Тип работ
                </th>
                <th className="pb-2 pt-0 px-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Сложность
                </th>
                <th className="pb-2 pt-0 px-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Ответственный
                </th>
                <th className="pb-2 pt-0 px-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Часы
                </th>
                <th className="pb-2 pt-0 px-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Прогресс
                </th>
                <th className="pb-2 pt-0 px-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Статус
                </th>
                <th className="pb-2 pt-0 px-2 text-left font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Дата
                </th>
                <th className="w-8 pb-2 pt-0"></th>
              </tr>
            </thead>
            <tbody>
              <SortableContext items={stage.decompositions.map((d) => d.id)} strategy={verticalListSortingStrategy}>
                {stage.decompositions.map((decomp) => (
                  <SortableDecompositionRow
                    key={decomp.id}
                    decomposition={decomp}
                    stageId={stage.id}
                    isSelected={selectedDecompositions.has(decomp.id)}
                    onToggleSelection={toggleDecompositionSelection}
                    onDelete={deleteDecomposition}
                    onUpdate={updateDecomposition}
                    autoFocus={focusedDecompositionId === decomp.id}
                    onDateConfirmed={() => addDecomposition(stage.id, { pending: true })}
                    onInteract={onDecompositionInteract}
                    isPendingNew={pendingNewDecompositionId === decomp.id}
                  />
                ))}
              </SortableContext>
            </tbody>
          </table>
        </div>
      </DndContext>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => addDecomposition(stage.id)}
        className="mt-2 h-8 text-xs text-muted-foreground hover:text-foreground"
      >
        <Plus className="mr-1.5 h-3.5 w-3.5" />
        Добавить декомпозицию
      </Button>
    </Card>
  );
}

function SortableDecompositionRow({
  decomposition,
  stageId,
  isSelected,
  onToggleSelection,
  onDelete,
  onUpdate,
  autoFocus,
  onDateConfirmed,
  onInteract,
  isPendingNew,
}: {
  decomposition: Decomposition;
  stageId: string;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onDelete: (stageId: string, decompId: string) => void;
  onUpdate: (stageId: string, decompId: string, updates: Partial<Decomposition>) => void;
  autoFocus: boolean;
  onDateConfirmed: () => void;
  onInteract: (decompId: string) => void;
  isPendingNew: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: decomposition.id,
  });
  const rowRef = useRef<HTMLTableRowElement | null>(null);
  const typeOfWorkTriggerRef = useRef<HTMLButtonElement | null>(null);
  const difficultyTriggerRef = useRef<HTMLButtonElement | null>(null);
  const responsibleTriggerRef = useRef<HTMLButtonElement | null>(null);
  const progressTriggerRef = useRef<HTMLButtonElement | null>(null);
  const statusTriggerRef = useRef<HTMLButtonElement | null>(null);
  const plannedHoursInputRef = useRef<HTMLInputElement | null>(null);
  const completionDateTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [openTypeOfWork, setOpenTypeOfWork] = useState(false);
  const [openDifficulty, setOpenDifficulty] = useState(false);
  const [openResponsible, setOpenResponsible] = useState(false);
  const [openProgress, setOpenProgress] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const lastClosedSelectRef = useRef<string | null>(null);
  const [interacted, setInteracted] = useState(false);
  

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  } as React.CSSProperties;

  const focusNextFrom = (currentEl: Element | null | undefined) => {
    if (!rowRef.current || !currentEl) return;
    const focusableElements = rowRef.current.querySelectorAll(
      'textarea, input[type="text"], input[type="number"], input[type="date"], button[role="combobox"]'
    );
    const currentIndex = Array.from(focusableElements).indexOf(currentEl as Element);
    const nextElement = focusableElements[currentIndex + 1] as HTMLElement | undefined;
    if (nextElement) {
      nextElement.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !(e as React.KeyboardEvent).shiftKey && !(e as React.KeyboardEvent).ctrlKey) {
      e.preventDefault();
      const rawTarget = e.target as HTMLElement | null;
      const targetEl = rawTarget?.closest(
        'button[role="combobox"], textarea, input[type="text"], input[type="number"], input[type="date"]'
      ) as HTMLElement | null;

      if (targetEl?.getAttribute("role") === "combobox") {
        // На селекте по Enter открываем список, не переходим дальше
        targetEl.click();
        return;
      }
      focusNextFrom(targetEl as Element);
    }
  };

  const markInteracted = () => {
    if (!interacted) {
      setInteracted(true);
      onInteract(decomposition.id);
    }
  };

  

  return (
    <tr
      ref={(node) => {
        setNodeRef(node as unknown as HTMLElement);
        rowRef.current = node as HTMLTableRowElement;
      }}
      style={style}
      className="group border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors"
      onFocus={() => {
        // Считаем, что строка теперь активна и не должна удаляться моментально
        markInteracted();
      }}
      onBlur={() => {
        if (!isPendingNew) return;
        setTimeout(() => {
          const stillInside = rowRef.current?.contains(document.activeElement);
          if (!stillInside && !interacted) {
            onDelete(stageId, decomposition.id);
          }
        }, 80);
      }}
    >
      <td className="py-1.5 px-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-40 hover:opacity-100 transition-opacity"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </td>
      <td className="py-1.5 px-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelection(decomposition.id)}
          className="h-4 w-4 rounded"
        />
      </td>
      <td className="py-1.5 px-2">
        <Textarea
          value={decomposition.description}
          onChange={(e) => {
            onUpdate(stageId, decomposition.id, { description: (e.target as HTMLTextAreaElement).value });
            markInteracted();
          }}
          onKeyDown={handleKeyDown}
          className="min-h-[24px] h-auto min-w-[180px] border-0 bg-muted/60 hover:bg-muted/80 focus:bg-muted focus:placeholder-transparent shadow-none rounded-lg px-3 py-1 text-xs resize-none overflow-hidden"
          rows={1}
          autoFocus={autoFocus}
          placeholder="Новая декомпозиция"
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = target.scrollHeight + "px";
          }}
        />
      </td>
      <td className="py-1.5 px-2">
        <Select
          open={openTypeOfWork}
          onOpenChange={(v) => {
            setOpenTypeOfWork(v);
            if (!v) lastClosedSelectRef.current = "typeOfWork";
          }}
          value={decomposition.typeOfWork}
          onValueChange={(value) => {
            onUpdate(stageId, decomposition.id, { typeOfWork: value });
            markInteracted();
            // После выбора закрываем и переходим к следующему полю
            setOpenTypeOfWork(false);
            setTimeout(() => {
              focusNextFrom(typeOfWorkTriggerRef.current);
            }, 0);
          }}
        >
          <SelectTrigger
            className={`h-6 min-h-0 py-0 px-2 leading-none text-xs [&_span]:leading-none border-0 shadow-none rounded-full bg-muted/60 hover:bg-muted/80 w-[120px] ${openTypeOfWork ? "ring-1 ring-ring/40 ring-offset-2" : ""}`}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (lastClosedSelectRef.current === "typeOfWork") {
                lastClosedSelectRef.current = null;
                return;
              }
              setOpenTypeOfWork(true);
            }}
            ref={typeOfWorkTriggerRef as unknown as React.Ref<HTMLButtonElement>}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            onPointerDownOutside={() => {
              try {
                typeOfWorkTriggerRef.current?.blur();
              } catch {}
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              try {
                typeOfWorkTriggerRef.current?.blur();
              } catch {}
            }}
          >
            {TYPE_OF_WORK_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-1.5 px-2">
        <Select
          open={openDifficulty}
          onOpenChange={(v) => {
            setOpenDifficulty(v);
            if (!v) lastClosedSelectRef.current = "difficulty";
          }}
          value={decomposition.difficulty}
          onValueChange={(value) => {
            onUpdate(stageId, decomposition.id, { difficulty: value });
            markInteracted();
            setOpenDifficulty(false);
            setTimeout(() => {
              focusNextFrom(difficultyTriggerRef.current);
            }, 0);
          }}
        >
          <SelectTrigger
            className={`h-6 min-h-0 py-0 px-2 leading-none text-xs [&_span]:leading-none border-0 shadow-none rounded-full w-[100px] ${getDifficultyColor(decomposition.difficulty)} ${openDifficulty ? "ring-1 ring-ring/40 ring-offset-2" : ""}`}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (lastClosedSelectRef.current === "difficulty") {
                lastClosedSelectRef.current = null;
                return;
              }
              setOpenDifficulty(true);
            }}
            ref={difficultyTriggerRef as unknown as React.Ref<HTMLButtonElement>}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            onPointerDownOutside={() => {
              try {
                difficultyTriggerRef.current?.blur();
              } catch {}
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              try {
                difficultyTriggerRef.current?.blur();
              } catch {}
            }}
          >
            {DIFFICULTY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-1.5 px-2">
        <Select
          open={openResponsible}
          onOpenChange={(v) => {
            setOpenResponsible(v);
            if (!v) lastClosedSelectRef.current = "responsible";
          }}
          value={decomposition.responsible}
          onValueChange={(value) => {
            onUpdate(stageId, decomposition.id, { responsible: value });
            markInteracted();
            setOpenResponsible(false);
            // В Arc (Windows) Select возвращает фокус на триггер при закрытии,
            // поэтому фокус переносим на поле часов с небольшим таймаутом
            setTimeout(() => {
              if (plannedHoursInputRef.current) {
                plannedHoursInputRef.current.focus();
                plannedHoursInputRef.current.select?.();
              } else {
                focusNextFrom(responsibleTriggerRef.current);
              }
            }, 50);
          }}
        >
          <SelectTrigger
            className={`h-6 min-h-0 py-0 px-2 leading-none text-xs [&_span]:leading-none border-0 shadow-none rounded-full bg-muted/60 hover:bg-muted/80 w-[130px] ${openResponsible ? "ring-1 ring-ring/40 ring-offset-2" : ""}`}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (lastClosedSelectRef.current === "responsible") {
                lastClosedSelectRef.current = null;
                return;
              }
              setOpenResponsible(true);
            }}
            ref={responsibleTriggerRef as unknown as React.Ref<HTMLButtonElement>}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            onPointerDownOutside={() => {
              try {
                responsibleTriggerRef.current?.blur();
              } catch {}
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              try {
                responsibleTriggerRef.current?.blur();
              } catch {}
            }}
          >
            {RESPONSIBLE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-1.5 px-2">
        <Input
          type="number"
          value={decomposition.plannedHours}
          onChange={(e) => {
            onUpdate(stageId, decomposition.id, { plannedHours: Number.parseInt((e.target as HTMLInputElement).value) || 0 });
            markInteracted();
          }}
          onKeyDown={handleKeyDown}
          className="h-6 w-[80px] border-0 bg-muted/60 hover:bg-muted/80 focus:bg-muted shadow-none rounded-full px-3 text-xs"
          ref={plannedHoursInputRef}
        />
      </td>
      <td className="py-1.5 px-2">
        <Select
          open={openProgress}
          onOpenChange={(v) => {
            setOpenProgress(v);
            if (!v) lastClosedSelectRef.current = "progress";
          }}
          value={decomposition.progress.toString()}
          onValueChange={(value) => {
            onUpdate(stageId, decomposition.id, { progress: Number.parseInt(value) });
            markInteracted();
            setOpenProgress(false);
            setTimeout(() => {
              focusNextFrom(progressTriggerRef.current);
            }, 0);
          }}
        >
          <SelectTrigger
            className={`h-6 min-h-0 py-0 px-2 leading-none text-xs [&_span]:leading-none border-0 shadow-none rounded-full w-[70px] ${getProgressColor(decomposition.progress)} ${openProgress ? "ring-1 ring-ring/40 ring-offset-2" : ""}`}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (lastClosedSelectRef.current === "progress") {
                lastClosedSelectRef.current = null;
                return;
              }
              setOpenProgress(true);
            }}
            ref={progressTriggerRef as unknown as React.Ref<HTMLButtonElement>}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            onPointerDownOutside={() => {
              try {
                progressTriggerRef.current?.blur();
              } catch {}
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              try {
                progressTriggerRef.current?.blur();
              } catch {}
            }}
          >
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
              <SelectItem key={value} value={value.toString()}>
                {value}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-1.5 px-2">
        <Select
          open={openStatus}
          onOpenChange={(v) => {
            setOpenStatus(v);
            if (!v) lastClosedSelectRef.current = "status";
          }}
          value={decomposition.status}
          onValueChange={(value) => {
            onUpdate(stageId, decomposition.id, { status: value });
            markInteracted();
            setOpenStatus(false);
            // Аналогично переносим фокус на поле даты (кнопка-триггер календаря)
            setTimeout(() => {
              if (completionDateTriggerRef.current) {
                completionDateTriggerRef.current.focus();
              } else {
                focusNextFrom(statusTriggerRef.current);
              }
            }, 50);
          }}
        >
          <SelectTrigger
            className={`h-6 min-h-0 py-0 px-2 leading-none text-xs [&_span]:leading-none border-0 shadow-none rounded-full w-[115px] ${getStatusColor(decomposition.status)} ${openStatus ? "ring-1 ring-ring/40 ring-offset-2" : ""}`}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (lastClosedSelectRef.current === "status") {
                lastClosedSelectRef.current = null;
                return;
              }
              setOpenStatus(true);
            }}
            ref={statusTriggerRef as unknown as React.Ref<HTMLButtonElement>}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent
            onPointerDownOutside={() => {
              try {
                statusTriggerRef.current?.blur();
              } catch {}
            }}
            onCloseAutoFocus={(e) => {
              e.preventDefault();
              try {
                statusTriggerRef.current?.blur();
              } catch {}
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="py-1.5 px-2">
        <DatePicker
          value={decomposition.completionDate}
          onChange={(val) => {
            onUpdate(stageId, decomposition.id, { completionDate: val });
            markInteracted();
            // Небольшая задержка, чтобы календарь закрылся и не украл фокус
            setTimeout(() => {
              onDateConfirmed();
            }, 30);
          }}
          triggerClassName="w-[125px]"
          onKeyDown={handleKeyDown}
          triggerRef={completionDateTriggerRef as unknown as React.Ref<HTMLButtonElement>}
        />
      </td>
      <td className="py-1.5 px-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(stageId, decomposition.id)}
          className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all active:scale-95"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

export default function StagesManagement() {
  const [stages, setStages] = useState<Stage[]>(initialStages);
  const [selectedStages, setSelectedStages] = useState<Set<string>>(new Set());
  const [selectedDecompositions, setSelectedDecompositions] = useState<Set<string>>(new Set());
  const [showPasteDialog, setShowPasteDialog] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const { toast } = useToast();
  const [isCopying, setIsCopying] = useState(false);
  const [focusedDecompositionId, setFocusedDecompositionId] = useState<string | null>(null);
  const [pendingNewDecomposition, setPendingNewDecomposition] = useState<{ stageId: string; decompId: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addStage = () => {
    const newStage: Stage = {
      id: Date.now().toString(),
      name: "Новый этап",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      decompositions: [],
    };
    setStages([...stages, newStage]);
  };

  const deleteStage = (stageId: string) => {
    setStages(stages.filter((s) => s.id !== stageId));
    setSelectedStages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(stageId);
      return newSet;
    });
  };

  const addDecomposition = (stageId: string, opts?: { pending?: boolean }) => {
    const newId = `${stageId}-${Date.now()}`;
    const newDecomposition: Decomposition = {
      id: newId,
      description: "",
      typeOfWork: "Разработка",
      difficulty: "Средняя",
      responsible: "",
      plannedHours: 0,
      progress: 0,
      status: "Не начато",
      completionDate: new Date().toISOString().split("T")[0],
    };

    setStages(
      stages.map((stage) =>
        stage.id === stageId ? { ...stage, decompositions: [...stage.decompositions, newDecomposition] } : stage
      )
    );
    setFocusedDecompositionId(newId);
    if (opts?.pending) {
      setPendingNewDecomposition({ stageId, decompId: newId });
    } else {
      setPendingNewDecomposition(null);
    }
  };

  const deleteDecomposition = (stageId: string, decompId: string) => {
    setStages(
      stages.map((stage) =>
        stage.id === stageId
          ? { ...stage, decompositions: stage.decompositions.filter((d) => d.id !== decompId) }
          : stage
      )
    );
    setSelectedDecompositions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(decompId);
      return newSet;
    });
    if (pendingNewDecomposition && pendingNewDecomposition.decompId === decompId) {
      setPendingNewDecomposition(null);
    }
  };

  const toggleStageSelection = (stageId: string) => {
    setSelectedStages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stageId)) {
        newSet.delete(stageId);
      } else {
        newSet.add(stageId);
      }
      return newSet;
    });
  };

  const toggleDecompositionSelection = (decompId: string) => {
    setSelectedDecompositions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(decompId)) {
        newSet.delete(decompId);
      } else {
        newSet.add(decompId);
      }
      return newSet;
    });
  };

  const updateStage = (stageId: string, updates: Partial<Stage>) => {
    setStages(stages.map((s) => (s.id === stageId ? { ...s, ...updates } : s)));
  };

  const updateDecomposition = (stageId: string, decompId: string, updates: Partial<Decomposition>) => {
    setStages(
      stages.map((stage) =>
        stage.id === stageId
          ? {
              ...stage,
              decompositions: stage.decompositions.map((d) => (d.id === decompId ? { ...d, ...updates } : d)),
            }
          : stage
      )
    );
  };

  const handleStageDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleDecompositionDragEnd = (stageId: string, event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setStages((stagesState) =>
        stagesState.map((stage) => {
          if (stage.id === stageId) {
            const oldIndex = stage.decompositions.findIndex((d) => d.id === active.id);
            const newIndex = stage.decompositions.findIndex((d) => d.id === over.id);
            return {
              ...stage,
              decompositions: arrayMove(stage.decompositions, oldIndex, newIndex),
            };
          }
          return stage;
        })
      );
    }
  };

  const handleDecompositionInteract = (decompId: string) => {
    if (pendingNewDecomposition && pendingNewDecomposition.decompId === decompId) {
      setPendingNewDecomposition(null);
    }
  };

  // Если пользователь не взаимодействовал с "ожидающей" строкой и ушел фокусом со строки — удалить
  // Удаление произойдет при первом взаимодействии вне этой строки: когда фокус переключится и pending ещё активен
  // Реализуем через эффект, отслеживающий blur всей таблицы было бы сложнее; здесь оставим управление в дочернем ряду через onInteract

  const handlePaste = () => {
    if (!pasteText.trim()) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, вставьте данные для импорта",
        variant: "destructive",
      });
      return;
    }

    try {
      const lines = pasteText.trim().split("\n");
      const dataLines = lines.filter((line) => line.trim() && !line.includes("Название этапа"));

      const stageMap = new Map<string, { stage: Partial<Stage>; decompositions: Decomposition[] }>();

      dataLines.forEach((line) => {
        const parts = line
          .split("|")
          .map((p) => p.trim())
          .filter((p) => p);

        if (parts.length >= 8) {
          const [stageName, description, typeOfWork, difficulty, responsible, plannedHours, status, completionDate] =
            parts;

          if (!stageMap.has(stageName)) {
            stageMap.set(stageName, {
              stage: { name: stageName },
              decompositions: [],
            });
          }

          const decomposition: Decomposition = {
            id: `${Date.now()}-${Math.random()}`,
            description,
            typeOfWork,
            difficulty,
            responsible,
            plannedHours: Number.parseInt(plannedHours) || 0,
            progress: 0,
            status,
            completionDate,
          };

          stageMap.get(stageName)!.decompositions.push(decomposition);
        }
      });

      const newStages = [...stages];

      stageMap.forEach((data, stageName) => {
        const existingStage = newStages.find((s) => s.name === stageName);

        if (existingStage) {
          existingStage.decompositions.push(...data.decompositions);
        } else {
          const newStage: Stage = {
            id: Date.now().toString() + Math.random(),
            name: stageName,
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
            decompositions: data.decompositions,
          };
          newStages.push(newStage);
        }
      });

      setStages(newStages);
      setPasteText("");
      setShowPasteDialog(false);

      toast({
        title: "Успешно",
        description: `Импортировано ${dataLines.length} декомпозиций`,
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось импортировать данные. Проверьте формат.",
        variant: "destructive",
      });
    }
  };

  const handleCopy = async () => {
    setIsCopying(true);
    setTimeout(() => setIsCopying(false), 200);

    try {
      let decompositionTable =
        "| Название этапа | Описание декомпозиции (название) | Тип работ | Сложность | Отвественный | Плановые часы | Статус | Дата (декомпозиции) |\n";
      decompositionTable += "|---|---|---|---|---|---|---|---|\n";

      stages.forEach((stage) => {
        stage.decompositions.forEach((decomp) => {
          decompositionTable += `| ${stage.name} | ${decomp.description} | ${decomp.typeOfWork} | ${decomp.difficulty} | ${decomp.responsible} | ${decomp.plannedHours} | ${decomp.status} | ${decomp.completionDate} |\n`;
        });
      });

      let stageTable = "\n\n| Название этапа | Дата начала этапа | Дата завершения этапа |\n";
      stageTable += "|---|---|---|\n";

      stages.forEach((stage) => {
        stageTable += `| ${stage.name} | ${stage.startDate} | ${stage.endDate} |\n`;
      });

      const fullText = decompositionTable + stageTable;

      await navigator.clipboard.writeText(fullText);

      toast({
        title: "Успешно",
        description: "Данные скопированы в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось скопировать данные",
        variant: "destructive",
      });
    }
  };

  const bulkDeleteStages = () => {
    if (selectedStages.size === 0) {
      toast({
        title: "Ошибка",
        description: "Не выбраны этапы для удаления",
        variant: "destructive",
      });
      return;
    }

    setStages(stages.filter((s) => !selectedStages.has(s.id)));
    setSelectedStages(new Set());

    toast({
      title: "Успешно",
      description: `Удалено этапов: ${selectedStages.size}`,
    });
  };

  const bulkDeleteDecompositions = () => {
    if (selectedDecompositions.size === 0) {
      toast({
        title: "Ошибка",
        description: "Не выбраны декомпозиции для удаления",
        variant: "destructive",
      });
      return;
    }

    const count = selectedDecompositions.size;

    setStages(
      stages.map((stage) => ({
        ...stage,
        decompositions: stage.decompositions.filter((d) => !selectedDecompositions.has(d.id)),
      }))
    );
    setSelectedDecompositions(new Set());

    toast({
      title: "Успешно",
      description: `Удалено декомпозиций: ${count}`,
    });
  };

  const selectAllStages = () => {
    if (selectedStages.size === stages.length) {
      setSelectedStages(new Set());
    } else {
      setSelectedStages(new Set(stages.map((s) => s.id)));
    }
  };

  const selectAllDecompositions = () => {
    const allDecompIds = stages.flatMap((s) => s.decompositions.map((d) => d.id));

    if (selectedDecompositions.size === allDecompIds.length) {
      setSelectedDecompositions(new Set());
    } else {
      setSelectedDecompositions(new Set(allDecompIds));
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Управление этапами</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowPasteDialog(true)} className="h-9">
              <ClipboardPaste className="mr-2 h-4 w-4" />
              Вставить
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className={`h-9 bg-transparent transition-transform active:scale-95 ${isCopying ? "scale-95" : ""}`}
            >
              <Copy className="mr-2 h-4 w-4" />
              Копировать
            </Button>
            <Button onClick={addStage} size="sm" className="h-9">
              <Plus className="mr-2 h-4 w-4" />
              Добавить этап
            </Button>
          </div>
        </div>

        {(selectedStages.size > 0 || selectedDecompositions.size > 0) && (
          <Card className="mb-6 p-4 shadow-sm border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {selectedStages.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Выбрано этапов: <span className="font-medium text-foreground">{selectedStages.size}</span>
                  </span>
                )}
                {selectedDecompositions.size > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Выбрано декомпозиций:{" "}
                    <span className="font-medium text-foreground">{selectedDecompositions.size}</span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedStages.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllStages}
                      className="h-8 text-xs bg-transparent"
                    >
                      {selectedStages.size === stages.length ? "Снять выбор" : "Выбрать все"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={bulkDeleteStages} className="h-8 text-xs">
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Удалить этапы
                    </Button>
                  </>
                )}
                {selectedDecompositions.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllDecompositions}
                      className="h-8 text-xs bg-transparent"
                    >
                      {selectedDecompositions.size === stages.flatMap((s) => s.decompositions).length
                        ? "Снять выбор"
                        : "Выбрать все"}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={bulkDeleteDecompositions} className="h-8 text-xs">
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Удалить декомпозиции
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleStageDragEnd}>
          <SortableContext items={stages.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {stages.map((stage) => (
                <SortableStage
                  key={stage.id}
                  stage={stage}
                  selectedStages={selectedStages}
                  selectedDecompositions={selectedDecompositions}
                  toggleStageSelection={toggleStageSelection}
                  toggleDecompositionSelection={toggleDecompositionSelection}
                  deleteStage={deleteStage}
                  deleteDecomposition={deleteDecomposition}
                  addDecomposition={addDecomposition}
                  updateStage={updateStage}
                  updateDecomposition={updateDecomposition}
                  onDecompositionDragEnd={handleDecompositionDragEnd}
                  focusedDecompositionId={focusedDecompositionId}
                  pendingNewDecompositionId={
                    pendingNewDecomposition && pendingNewDecomposition.stageId === stage.id
                      ? pendingNewDecomposition.decompId
                      : null
                  }
                  onDecompositionInteract={handleDecompositionInteract}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <Dialog open={showPasteDialog} onOpenChange={setShowPasteDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Вставить данные</DialogTitle>
              <DialogDescription className="text-sm">
                Вставьте табличные данные в формате: Название этапа | Описание | Тип работ | Сложность | Ответственный |
                Плановые часы | Статус | Дата
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={pasteText}
              onChange={(e) => setPasteText((e.target as HTMLTextAreaElement).value)}
              placeholder="Вставьте данные здесь..."
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPasteDialog(false)}>
                Отмена
              </Button>
              <Button onClick={handlePaste}>Импортировать</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


