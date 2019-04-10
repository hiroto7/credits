import { C1, C2 } from "./Constraint";

export default interface Course {
    title: string;
    code: string;
    creditsCount: number;
}
export const isCourse = (obj: Course | C1 | C2): obj is Course => 'title' in obj && 'code' in obj && 'creditsCount' in obj;
