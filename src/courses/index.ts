import Course from '../Course';
import courses from './courses1.json';

export const codeToCourse = new Map<string, Course>();

for (const course of courses) {
    codeToCourse.set(course.code, course);
}
