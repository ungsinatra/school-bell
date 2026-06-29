import { Button } from "@base-ui/react/button";
import { Save } from "lucide-react";
import type { ReactNode } from "react";
import "./page-header.css";

interface PageHeaderProps {
  title: string;
  description: string;
  onSave: () => void;
  saving?: boolean;
  disabled?: boolean;
  saveLabel?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({
  title,
  description,
  onSave,
  saving = false,
  disabled = false,
  saveLabel = "Сохранить",
  icon,
  children,
}: PageHeaderProps) {
  return (
    <div className="page-header">
      <div className="page-header__left">
        {icon && <div className="page-header__icon">{icon}</div>}
        <div className="page-header__text">
          <h1 className="page-header__title">{title}</h1>
          <p className="page-header__description">{description}</p>
        </div>
      </div>
      <div className="page-header__actions">
        {children}
        <Button
          className="page-header__save"
          onClick={onSave}
          disabled={saving || disabled}
        >
          {saving ? <span className="page-header__spinner" /> : <Save size={16} />}
          {saving ? "Сохранение..." : saveLabel}
        </Button>
      </div>
    </div>
  );
}
