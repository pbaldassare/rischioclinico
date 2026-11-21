import * as React from "react";
import { cn } from "@/lib/utils";

export function etichettaCelle(tabella: HTMLTableElement) {
  const intestazioni: string[] = [];
  const primaRiga = tabella.tHead?.rows[0];
  if (primaRiga) {
    for (const th of Array.from(primaRiga.cells)) {
      for (let i = 0; i < th.colSpan; i++) intestazioni.push(th.textContent?.trim() ?? "");
    }
  }
  for (const corpo of Array.from(tabella.tBodies)) {
    for (const riga of Array.from(corpo.rows)) {
      let colonna = 0;
      for (const cella of Array.from(riga.cells)) {
        const testo = cella.colSpan > 1 ? "" : (intestazioni[colonna] ?? "");
        if (cella.dataset.label !== testo) cella.dataset.label = testo;
        colonna += cella.colSpan;
      }
    }
  }
}

export function avviaTabelleMobile() {
  let inAttesa = false;
  const aggiorna = () => {
    inAttesa = false;
    document.querySelectorAll<HTMLTableElement>("table.tabella-mobile").forEach(etichettaCelle);
  };
  new MutationObserver(() => {
    if (!inAttesa) {
      inAttesa = true;
      setTimeout(aggiorna, 0);
    }
  }).observe(document.body, { childList: true, subtree: true, characterData: true });
  aggiorna();
}

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("tabella-mobile w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn("border-b transition-colors data-[state=selected]:bg-muted hover:bg-muted/50", className)}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn("h-12 px-4 text-left align-middle font-medium text-muted-foreground", className)}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => <td ref={ref} className={cn("p-4 align-middle", className)} {...props} />,
);
TableCell.displayName = "TableCell";

export { Table, TableHeader, TableBody, TableHead, TableRow, TableCell };
