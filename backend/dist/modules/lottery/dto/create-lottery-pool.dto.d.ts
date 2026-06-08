declare class PrizeItemDto {
    name: string;
    total_count: number;
    image_url?: string;
    value?: number;
}
export declare class CreateLotteryPoolDto {
    event_id: string;
    name: string;
    prizes: PrizeItemDto[];
}
export {};
