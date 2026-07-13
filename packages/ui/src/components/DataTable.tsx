import * as React from "react"
import { cn } from "@/lib/utils"

export interface Column<T> {
  key: keyof T | string
  label: string
  align?: "left" | "center" | "right"
  render?: (row: T) => React.ReactNode
}

export interface DataTableProps<T> extends React.HTMLAttributes<HTMLDivElement> {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  rows,
  onRowClick,
  className,
  ...props
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto", className)} {...props}>
      <table className="w-full text-left text-sm text-body">
        <thead className="bg-surface sticky top-0 border-b border-border-subtle font-mono text-[11px] uppercase tracking-wider text-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  "h-10 px-4 align-middle font-medium",
                  col.align === "center" && "text-center",
                  col.align === "right" && "text-right"
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="h-24 text-center text-muted"
              >
                Nenhum resultado encontrado.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-border-subtle transition-colors hover:bg-hover",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      "h-11 px-4 align-middle",
                      col.align === "center" && "text-center",
                      col.align === "right" && "text-right"
                    )}
                  >
                    {col.render
                      ? col.render(row)
                      : (row as any)[col.key as string]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
