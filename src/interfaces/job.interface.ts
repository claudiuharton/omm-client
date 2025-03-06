export interface Job {
    name:string,
    duration:number,
    searchQuery:string,
    id:string

}

export interface JobResponse {
    responseObject: [Job];
}
