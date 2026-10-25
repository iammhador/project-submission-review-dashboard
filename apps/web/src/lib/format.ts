const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium" });
const dateTimeFormat = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDate(value: string) {
  return dateFormat.format(new Date(value));
}

export function formatDateTime(value: string) {
  return dateTimeFormat.format(new Date(value));
}

/** "github.com/alice/portfolio" from "https://github.com/alice/portfolio". */
export function displayUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.host}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return value;
  }
}
