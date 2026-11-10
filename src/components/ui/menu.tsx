import type { ReactNode } from "react"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

type MenuProps = {
  label: ReactNode
  children: ReactNode
  align?: "start" | "center" | "end"
  className?: string
  ariaLabel?: string
  caret?: boolean
  disabled?: boolean
}

export function Menu({ label, children, align = "start", className, ariaLabel, caret = true, disabled }: MenuProps) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className={cn("menu-trigger", className)} aria-label={ariaLabel} disabled={disabled}>
        {label}
        {caret ? <ChevronDown className="menu-caret" size={14} aria-hidden="true" /> : null}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="menu" align={align} sideOffset={6} collisionPadding={8}>
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

type ItemProps = {
  children: ReactNode
  onSelect: () => void
  hint?: string
  disabled?: boolean
  icon?: ReactNode
}

export function MenuItem({ children, onSelect, hint, disabled, icon }: ItemProps) {
  return (
    <DropdownMenu.Item className="menu-item" onSelect={onSelect} disabled={disabled}>
      <span className="menu-icon" aria-hidden="true">{icon}</span>
      <span className="menu-text">{children}</span>
      {hint ? <kbd className="menu-hint">{hint}</kbd> : null}
    </DropdownMenu.Item>
  )
}

export function MenuCheck({ children, checked, onSelect, hint }: { children: ReactNode; checked: boolean; onSelect: () => void; hint?: string }) {
  return (
    <DropdownMenu.CheckboxItem
      className="menu-item"
      checked={checked}
      onSelect={(event) => {
        event.preventDefault()
        onSelect()
      }}
    >
      <span className="menu-icon" aria-hidden="true">
        <DropdownMenu.ItemIndicator>
          <Check size={14} />
        </DropdownMenu.ItemIndicator>
      </span>
      <span className="menu-text">{children}</span>
      {hint ? <kbd className="menu-hint">{hint}</kbd> : null}
    </DropdownMenu.CheckboxItem>
  )
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <DropdownMenu.Label className="menu-label">{children}</DropdownMenu.Label>
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="menu-sep" />
}

export function SubMenu({ label, children, icon }: { label: ReactNode; children: ReactNode; icon?: ReactNode }) {
  return (
    <DropdownMenu.Sub>
      <DropdownMenu.SubTrigger className="menu-item">
        <span className="menu-icon" aria-hidden="true">{icon}</span>
        <span className="menu-text">{label}</span>
        <ChevronDown className="menu-sub-caret" size={14} aria-hidden="true" />
      </DropdownMenu.SubTrigger>
      <DropdownMenu.Portal>
        <DropdownMenu.SubContent className="menu" sideOffset={4} collisionPadding={8}>
          {children}
        </DropdownMenu.SubContent>
      </DropdownMenu.Portal>
    </DropdownMenu.Sub>
  )
}
