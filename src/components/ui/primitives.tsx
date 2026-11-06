import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from 'react';
import { Shield } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg' | 'icon';
}) {
  return (
    <button
      className={cn('btn', `btn-${variant}`, size !== 'md' && `btn-${size}`, className)}
      {...props}
    />
  );
}
export function Badge({ tone = 'neutral', children }: { tone?: string; children: ReactNode }) {
  return <span className={cn('badge', `tone-${tone}`)}>{children}</span>;
}
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={cn('avatar', `avatar-${size}`)} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
export function Input({
  label,
  icon,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: ReactNode; error?: string }) {
  const fieldId = id ?? props.name;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}</label>
      <div className={icon ? 'input-icon' : undefined}>
        {icon}
        <input
          id={fieldId}
          aria-invalid={!!error}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...props}
        />
      </div>
      {error && (
        <span id={`${fieldId}-error`} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}
export function Select({
  label,
  id,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div className="field">
      <label htmlFor={id ?? props.name}>{label}</label>
      <select id={id ?? props.name} {...props}>
        {children}
      </select>
    </div>
  );
}
export function Note({
  children,
  tone = 'subtle',
  icon = <Shield />,
}: {
  children: ReactNode;
  tone?: 'subtle' | 'accent' | 'success' | 'warning' | 'danger';
  icon?: ReactNode;
}) {
  return (
    <div className={cn('note', `note-${tone}`)}>
      {icon}
      <div>{children}</div>
    </div>
  );
}
export function StatCard({
  label,
  value,
  caption,
}: {
  label: string;
  value: ReactNode;
  caption?: string;
}) {
  return (
    <div className="card stack" style={{ gap: 8 }}>
      <p className="overline muted">{label}</p>
      <div className="stat-value">{value}</div>
      {caption && <p className="caption">{caption}</p>}
    </div>
  );
}
export function DayChip({
  weekday,
  date,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { weekday: string; date: string }) {
  return (
    <button type="button" className="day-chip" {...props}>
      <span className="caption" style={{ color: 'inherit' }}>
        {weekday}
      </span>
      <strong>{date}</strong>
    </button>
  );
}
export function TimeSlot({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="time-slot" {...props}>
      {children}
    </button>
  );
}
