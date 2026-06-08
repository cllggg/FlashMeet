export declare class IcebreakerOptionDto {
    key: string;
    label: string;
    tag: string;
    color: string;
}
export declare class CreateIcebreakerDto {
    event_id: string;
    prompt: string;
    options: IcebreakerOptionDto[];
    display_order?: number;
}
