interface Props {
  username: string;
  color: string;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "h-6 w-6 text-xs", md: "h-8 w-8 text-sm", lg: "h-10 w-10 text-base" };

export default function Avatar({ username, color, size = "md" }: Props) {
  return (
    <div
      className={`${sizes[size]} flex items-center justify-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: color }}
      title={username}
    >
      {username[0].toUpperCase()}
    </div>
  );
}
