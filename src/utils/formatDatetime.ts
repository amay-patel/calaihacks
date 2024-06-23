export function formatDatetime(datetime: string) {
    console.log(datetime)
    return new Date(datetime).toLocaleString();
}