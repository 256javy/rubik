import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function SettingsSection({
  title,
  description,
  children,
  initialOpen = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  initialOpen?: boolean;
}) {
  return (
    <details
      className="settings-section"
      name="cube-settings"
      open={initialOpen || undefined}
    >
      <summary>
        <span>
          <strong>{title}</strong>
          <small>{description}</small>
        </span>
        <ChevronDown size={18} />
      </summary>
      <div className="settings-content">{children}</div>
    </details>
  );
}

export function ToggleSetting({
  title,
  description,
  value,
  onChange,
}: {
  title: string;
  description: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="setting-row">
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <button
        className={`toggle ${value ? "selected" : ""}`}
        aria-label={title}
        aria-pressed={value}
        onClick={onChange}
      >
        <span className="switch">
          <i />
        </span>
      </button>
    </div>
  );
}
