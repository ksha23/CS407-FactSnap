export function formatCreationDate(dateString: string) {
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
    };

    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US", options);

    return `${formattedDate}`;
}

export function formatDateString(dateString: string) {
    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
    };

    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-US", options);

    const time = date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
    });

    return `${formattedDate} at ${time}`;
}

export const multiFormatDateString = (timestamp: string = ""): string => {
    const timestampNum = Math.round(new Date(timestamp).getTime() / 1000);
    const date: Date = new Date(timestampNum * 1000);
    const now: Date = new Date();

    const diff: number = now.getTime() - date.getTime();
    const diffInSeconds: number = diff / 1000;
    const diffInMinutes: number = diffInSeconds / 60;
    const diffInHours: number = diffInMinutes / 60;
    const diffInDays: number = diffInHours / 24;

    switch (true) {
        case Math.floor(diffInDays) >= 30:
            return formatDateString(timestamp);
        case Math.floor(diffInDays) === 1:
            return `${Math.floor(diffInDays)} day ago`;
        case Math.floor(diffInDays) > 1 && diffInDays < 30:
            return `${Math.floor(diffInDays)} days ago`;
        case Math.floor(diffInHours) >= 1:
            return `${Math.floor(diffInHours)} hours ago`;
        case Math.floor(diffInMinutes) >= 1:
            return `${Math.floor(diffInMinutes)} minutes ago`;
        default:
            return "Just now";
    }
};

export function formatExpirationDate(timestamp: string): string {
    const now = new Date();
    const end = new Date(timestamp);
    const diffMs = end.getTime() - now.getTime();

    if (diffMs <= 0) return "expired";

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);

    if (diffDay >= 1) return `${diffDay}d left`;
    if (diffHr >= 1) return `${diffHr}h left`;
    if (diffMin >= 1) return `${diffMin}m left`;
    return `${diffSec}s left`;
}

export function formatDisplayNumber(num: number): string {
    if (num < 1000) {
        // If less than 1000, return the number as it is.
        return num.toString();
    } else if (num < 1000000) {
        // If the number is in thousands, format it with "k".
        return (num / 1000).toFixed(2) + "k";
    } else if (num < 1000000000) {
        // If the number is in millions, format it with "M".
        return (num / 1000000).toFixed(2) + "M";
    } else {
        // If the number is in billions or more, format it with "B".
        return (num / 1000000000).toFixed(2) + "B";
    }
}
