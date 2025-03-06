export interface PartItem {
    id:string,
    title:string,
    tier:string,
    top:[string],
    price:number,
    category:number,

}

export interface PartItemResponse {
    responseObject: [PartItem];
}
