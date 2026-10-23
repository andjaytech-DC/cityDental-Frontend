import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function ArrowUpRightIcon(props: IconProps) {
  return <Icon {...props}><path d="M7 17 17 7" /><path d="M8 7h9v9" /></Icon>;
}

export function CheckIcon(props: IconProps) {
  return <Icon {...props}><path d="m5 12.5 4.2 4.2L19 7" /></Icon>;
}

export function ToothIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5.2c-1.8-1.3-4.3-1.1-5.6.4-1.5 1.7-1 4.1-.3 5.8.4 1 .6 2.2.8 3.5.2 1.4.5 2.9 1.2 3.6.9.9 2 .1 2.2-1.1.2-1.2.2-2.5.7-3.6.5 1.1.5 2.4.7 3.6.2 1.2 1.3 2 2.2 1.1.7-.7 1-2.2 1.2-3.6.2-1.3.4-2.5.8-3.5.7-1.7 1.2-4.1-.3-5.8-1.3-1.5-3.8-1.7-5.6-.4Z" />
    </Icon>
  );
}

export function SurgeryIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 6.3c-1.6-1.1-3.8-.9-5 .4-1.3 1.5-.9 3.6-.3 5.1.4.9.5 2 .7 3.1.2 1.2.4 2.5 1.1 3.2.8.8 1.8.1 2-1 .2-1 .2-2.2.6-3.2.4 1 .4 2.2.6 3.2.2 1.1 1.2 1.8 2 1 .7-.7.9-2 1.1-3.2.2-1.1.3-2.2.7-3.1.6-1.5 1-3.6-.3-5.1-1.2-1.3-3.4-1.5-5-.4Z" />
      <path d="M17.5 3v4M15.5 5h4" />
    </Icon>
  );
}

export function ImplantIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.5c-1.7 0-3 1.1-3 2.5 0 1.2 1 2.1 2.2 2.4v1.1h1.6V8.4c1.2-.3 2.2-1.2 2.2-2.4 0-1.4-1.3-2.5-3-2.5Z" />
      <path d="M10.5 9.5h3l-.3 2h-2.4l-.3-2Z" />
      <path d="M10.8 11.5h2.4l-.2 2h-2l-.2-2Z" />
      <path d="M11 13.5h2l-.2 2h-1.6l-.2-2Z" />
      <path d="M11.3 15.5h1.4L12 19l-.7-3.5Z" />
    </Icon>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3 1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7L12 3Z" />
      <path d="m18.5 16 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
    </Icon>
  );
}

export function ShieldCheckIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3 5 6v5.2c0 4.2 2.8 8 7 9.8 4.2-1.8 7-5.6 7-9.8V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8.8 8.8 0 0 1-3.2-.6L4 20l1.4-4.2A7.3 7.3 0 0 1 4.5 12 7.5 7.5 0 0 1 12 4.5a7.5 7.5 0 0 1 8 7Z" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01" />
    </Icon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M7.5 3.5V7M16.5 3.5V7M3.5 10h17" />
      <path d="M8 13h.01M12 13h.01M16 13h.01M8 16.5h.01M12 16.5h.01" />
    </Icon>
  );
}

export function PhoneIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.2 4.5 5.5 5.8c-1 .5-1.4 1.7-1 2.8 2 5.4 6.5 9.9 11.9 11.9 1.1.4 2.3 0 2.8-1l1.3-2.7-4.3-2-1.4 2.2a14.5 14.5 0 0 1-6.8-6.8l2.2-1.4-2-4.3Z" />
    </Icon>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </Icon>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </Icon>
  );
}

export function HeartIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 8.7c0 4.6-8.5 10-8.5 10s-8.5-5.4-8.5-10a4.7 4.7 0 0 1 8.5-2.8 4.7 4.7 0 0 1 8.5 2.8Z" />
    </Icon>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.8M17 14.2a5.5 5.5 0 0 1 3.5 4.8" />
    </Icon>
  );
}
