import parse from 'csv-parse/lib/sync';
import React, { useCallback, useState } from 'react';
import { Badge, Button, ButtonGroup, Form, Modal, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import AssignmentsFindView from './AssignmentsFindView';
import { CourseRegistrationStatusBadge, DisabledCourseBadge } from './badges';
import Course from './Course';
import Plan, { getNextStatus, isRegistrable, RegistrationStatus } from './Plan';
import RegistrationStatusLockTarget from './RegistrationStatusLockTarget';
import Requirements, { RequirementWithCourses } from './Requirements';
import safely from './safely';

const placeholder = `
"学籍番号","学生氏名","科目番号","科目名 ","単位数","春学期","秋学期","総合評価","科目区分","開講年度","開講区分"
"201700000","＊＊ ＊＊","GB10615","コンピュータリテラシ"," 2.0","-","-","A","A","2017","通常"
"201700000","＊＊ ＊＊","GB10664","プログラミング入門A"," 1.0","-","-","A","A","2017","通常"
`.trim();

type RegistrationStatus12 = RegistrationStatus.Registered | RegistrationStatus.Acquired

const Table1: React.FC<{
    codeColumnIndex: number,
    titleColumnIndex: number | undefined,
    creditsCountColumnIndex: number | undefined,
    courseAndRecordPairs: readonly CourseAndRecordPair[],
    courseToStatus: ReadonlyMap<Course, RegistrationStatus>,
    setCourseToStatus: (courseToStatus: ReadonlyMap<Course, RegistrationStatus>) => void,
}> = ({ codeColumnIndex, titleColumnIndex, creditsCountColumnIndex, courseAndRecordPairs, courseToStatus, setCourseToStatus }) => {
    const {
        course: firstCourse,
        record: firstRecord,
    } = courseAndRecordPairs[0];

    const firstRecordIsHeader =
        firstCourse === undefined &&
        firstRecord[codeColumnIndex].trim() === '科目番号' &&
        (titleColumnIndex === undefined || firstRecord[titleColumnIndex].trim() === '科目名') &&
        (creditsCountColumnIndex === undefined || firstRecord[creditsCountColumnIndex].trim() === '単位数');

    return (
        <Table
            bordered hover responsive
            style={{ whiteSpace: 'nowrap' }}
        >
            <thead>
                <tr>
                    <th></th>
                    <th>科目番号</th>
                    <th>科目名</th>
                    <th>単位数</th>
                    {
                        firstRecord
                            .map((cell, index) => (<th key={index}>{firstRecordIsHeader ? cell : (<></>)}</th>))
                            .filter((_, index) => index !== codeColumnIndex && index !== titleColumnIndex && index !== creditsCountColumnIndex)
                    }
                </tr>
            </thead>
            <tbody>
                {
                    (firstRecordIsHeader ? courseAndRecordPairs.slice(1) : courseAndRecordPairs).map(
                        ({ course, record }, recordIndex) => {
                            const getTdContent = <T,>(index: number | undefined, mapCourse: (course: Course) => T, mapRecord: (recordValue: string) => T) => {
                                const recordValue = index === undefined ? undefined : record[index];
                                return (
                                    course === undefined ?
                                        recordValue :
                                        recordValue === undefined || mapRecord(recordValue) === mapCourse(course) ?
                                            mapCourse(course) :
                                            (
                                                <>
                                                    <div><del>{recordValue}</del></div>
                                                    <div><ins>{mapCourse(course)}</ins></div>
                                                </>
                                            )
                                );
                            }

                            const tds0 = (
                                <>
                                    <td><code>{record[codeColumnIndex]}</code></td>
                                    <td>{getTdContent(titleColumnIndex, course => course.title, recordTitle => recordTitle.trim())}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        {getTdContent(creditsCountColumnIndex, course => course.creditCount, recordCreditsCount => +recordCreditsCount)}
                                    </td>
                                </>
                            );
                            const tds1 = record
                                .map((cell, index) => (
                                    <td key={index}>
                                        {
                                            index === codeColumnIndex ?
                                                (<code>{cell}</code>) :
                                                index === titleColumnIndex ?
                                                    cell :
                                                    (<span className="text-muted">{cell}</span>)
                                        }
                                    </td>
                                ))
                                .filter((_, index) =>
                                    index !== codeColumnIndex &&
                                    index !== titleColumnIndex &&
                                    index !== creditsCountColumnIndex
                                );

                            const tds = (<>{tds0}{tds1}</>);

                            if (course === undefined) {
                                return (
                                    <tr key={recordIndex} className="table-secondary">
                                        <td style={{ textAlign: 'center' }}>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip id={`record${recordIndex}-tooltip`}>この科目は定義されていないため、このツールでは利用できません。</Tooltip>
                                                }
                                            >
                                                <Badge variant="secondary">未定義</Badge>
                                            </OverlayTrigger>
                                        </td>
                                        {tds}
                                    </tr>
                                )
                            } else if (isRegistrable({ course, courseToStatus })) {
                                const status = courseToStatus.get(course) ?? RegistrationStatus.Unregistered;
                                const nextStatus = getNextStatus({ currentStatus: status, lockTarget: RegistrationStatusLockTarget.None });

                                return (
                                    <tr
                                        key={recordIndex}
                                        onClick={
                                            () => setCourseToStatus(new Map([
                                                ...courseToStatus,
                                                [course, nextStatus]
                                            ]))
                                        }
                                        style={{ cursor: 'pointer' }}
                                        className={status === RegistrationStatus.Unregistered ? undefined : `table-${status === RegistrationStatus.Acquired ? 'success' : 'primary'}`}
                                    >
                                        <td style={{ textAlign: 'center' }}>
                                            <CourseRegistrationStatusBadge status={status} />
                                        </td>
                                        {tds}
                                    </tr>
                                );
                            } else {
                                return (
                                    <tr key={recordIndex}>
                                        <td style={{ textAlign: 'center' }}>
                                            <DisabledCourseBadge id={`record${recordIndex}-tooltip`} />
                                        </td>
                                        {tds}
                                    </tr>
                                )
                            }

                        }
                    )
                }
            </tbody>
        </Table>
    );
}

interface CourseAndRecordPair {
    course: Course | undefined;
    record: readonly string[];
}

const f0 = <T, U, V, W>(
    recordLikeList: readonly T[],
    getRecord: (recordLike: T) => readonly string[],
    getInitial0: (count: number) => U,
    getCount0: (countLike: U) => number,
    getTemp0: (recordValue: string, recordLike: T) => V,
    determine: (temp0: V) => boolean,
    getReturnValue0: (count: number, previous: U, temp0: V) => U,
    getInitial1: ({ count, index }: { count: number, index: number | undefined }) => W,
    getCount1: (countLike: W) => number,
    getReturnValue1: (current: U, index: number) => W,
) => {
    const firstRecord = getRecord(recordLikeList[0]);
    return firstRecord
        .map((_, index) => recordLikeList.reduce((previous, recordLike) => {
            const record = getRecord(recordLike);
            const recordValue = record[index];
            const count = getCount0(previous);
            const t = getTemp0(recordValue, recordLike);
            const nextCount = determine(t) ? count + 1 : count;
            return getReturnValue0(nextCount, previous, t);
        }, getInitial0(0)))
        .reduce((previous, current, index) => {
            if (getCount0(current) > getCount1(previous)) {
                return getReturnValue1(current, index);
            } else {
                return previous;
            }
        }, getInitial1({ count: 0, index: undefined }));
}

const getColumnIndex = <T,>(courseAndRecordPairs: readonly CourseAndRecordPair[], mapCourse: (course: Course) => T, mapRecord: (recordValue: string) => T) =>
    f0(
        courseAndRecordPairs,
        courseAndRecordPair => courseAndRecordPair.record,
        count => count,
        count => count,
        (recordValue, { course }) => ({ recordValue, course }),
        ({ recordValue, course }) => course !== undefined && mapRecord(recordValue) === mapCourse(course),
        count => count,
        ({ count, index }) => ({ count, index }),
        ({ count }) => count,
        (count, index) => ({ count, index })
    ).index;

const Modal1: React.FC<{
    codeColumnIndex: number,
    courseAndRecordPairs: readonly CourseAndRecordPair[],
    show: boolean,
    courseToStatus: ReadonlyMap<Course, RegistrationStatus>,
    setCourseToStatus: (courseToStatus: ReadonlyMap<Course, RegistrationStatus>) => void,
    onCancel: () => void,
    onSubmit: () => void,
}> = ({ codeColumnIndex, courseAndRecordPairs, show, courseToStatus, setCourseToStatus, onCancel, onSubmit }) => {
    const titleColumnIndex = getColumnIndex(courseAndRecordPairs, course => course.title, recordTitle => recordTitle.trim());
    const creditsCountColumnIndex = getColumnIndex(courseAndRecordPairs, course => course.creditCount, recordCreditsCount => +recordCreditsCount)

    const setAllCourseStatus = useCallback((status: RegistrationStatus12) => {
        const nextCourseToStatus = new Map();
        for (const { course } of courseAndRecordPairs) {
            if (course !== undefined && isRegistrable({ course, courseToStatus: nextCourseToStatus })) {
                nextCourseToStatus.set(course, status);
            }
        }
        setCourseToStatus(nextCourseToStatus);
    }, [courseAndRecordPairs, setCourseToStatus]);
    const setAllCourseStatusToRegistered = useCallback(() => setAllCourseStatus(RegistrationStatus.Registered), [setAllCourseStatus]);
    const setAllCourseStatusToAcquired = useCallback(() => setAllCourseStatus(RegistrationStatus.Acquired), [setAllCourseStatus]);

    return (
        <Modal size="xl" show={show} onHide={onCancel}>
            <Modal.Header closeButton>
                <Modal.Title>CSVから履修状況を一括登録</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>CSVデータから見つかった科目が以下に表示されています。</p>
                <p>
                    それぞれの科目を [履修する] / [修得済み] のどちらかに設定してください。
                    CSVデータに不要な科目が含まれている場合は、 [履修しない] に設定してください。
                </p>
                <p>
                    [OK] を押すと、設定された履修状況のもとで、最適な科目群への割り当てがないか探します。
                    割り当てが見つかればそれが適用され、見つからない場合は履修状況の設定だけが行われます。
                    <strong>現在の履修 / 修得状況は失われます。</strong>
                </p>
                <ButtonGroup className="mb-3">
                    <Button
                        variant="outline-primary"
                        onClick={setAllCourseStatusToRegistered}
                    >
                        すべて履修する
                    </Button>
                    <Button
                        variant="outline-success"
                        onClick={setAllCourseStatusToAcquired}
                    >
                        すべて修得済み
                    </Button>
                </ButtonGroup>
                <Table1
                    codeColumnIndex={codeColumnIndex}
                    titleColumnIndex={titleColumnIndex}
                    creditsCountColumnIndex={creditsCountColumnIndex}
                    courseAndRecordPairs={courseAndRecordPairs}
                    courseToStatus={courseToStatus}
                    setCourseToStatus={setCourseToStatus}
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onCancel}>戻る</Button>
                <Button onClick={onSubmit}>OK</Button>
            </Modal.Footer>
        </Modal>
    );
}

const Modal0: React.FC<{
    codeToCourse: ReadonlyMap<string, Course>,
    show: boolean,
    onCancel: () => void,
    onSubmit: ({ courseAndRecordPairs, codeColumnIndex }: {
        courseAndRecordPairs: readonly CourseAndRecordPair[],
        codeColumnIndex: number,
    }) => void,
}> = ({ codeToCourse, show, onCancel: onHide, onSubmit }) => {
    const [csv, setCSV] = useState("");
    const [validated, setValidated] = useState(false);

    const records: readonly (readonly string[])[] | undefined = safely(parse, csv);
    const { courseAndRecordPairs, index: codeColumnIndex } = (
        records === undefined || records.length === 0 ? undefined : f0(
            records,
            record => record,
            count => ({
                count,
                courseAndRecordPairs: new Array<CourseAndRecordPair>()
            }),
            ({ count }) => count,
            (code, record) => ({
                course: codeToCourse.get(code.trim()),
                record,
            }),
            ({ course }) => course !== undefined,
            (count, { courseAndRecordPairs }, { record, course }) => ({
                count,
                courseAndRecordPairs: [...courseAndRecordPairs, { record, course }],
            }),
            ({ count, index }): {
                count: number,
                index: number | undefined,
                courseAndRecordPairs: readonly CourseAndRecordPair[] | undefined
            } => ({
                count, index,
                courseAndRecordPairs: undefined,
            }),
            ({ count }) => count,
            ({ count, courseAndRecordPairs }, index) => ({ count, courseAndRecordPairs, index })
        )
    ) ?? {
        courseAndRecordPairs: undefined,
        index: undefined,
    };

    const feedback =
        records === undefined ? 'CSVの形式が不正です' :
            records.length === 0 ? 'CSVを入力してください' :
                codeColumnIndex === undefined ? '科目がひとつも見つかりません' :
                    undefined;

    const handleCSVChange = useCallback((nextCSV: string) => {
        setCSV(nextCSV);
        setValidated(true);
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.item(0);
        if (file === null || file === undefined) {
            return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', () => {
            if (typeof reader.result === 'string') {
                handleCSVChange(reader.result);
            }
        });
        reader.readAsText(file);
    }, [handleCSVChange]);

    return (
        <Modal size="lg" show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>CSVから履修状況を一括登録</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    ひとつの列に科目番号が記述されたCSVデータを用意してください。
                    次のようなCSVデータを使用できます。
                </p>
                <ul>
                    <li>TWINS の [成績照会] 画面からダウンロードしたCSVファイル</li>
                    <li>各行に科目番号のみを記述したデータ</li>
                </ul>
                <p>
                    用意したデータをテキストボックスに貼り付けるか、ファイルとして読み込んでください。
                </p>

                <Form.Group>
                    <Form.Label>CSV / 科目番号のリスト</Form.Label>
                    <Form.Control
                        as="textarea"
                        rows={5}
                        placeholder={placeholder}
                        value={csv}
                        className="text-monospace"
                        onChange={
                            (event: React.ChangeEvent<HTMLTextAreaElement>) => handleCSVChange(event.target.value)
                        }
                        style={{ whiteSpace: 'pre' }}
                        isInvalid={validated && feedback !== undefined}
                    />
                    <Form.Control.Feedback type="invalid">{feedback}</Form.Control.Feedback>
                </Form.Group>
                <Button as="label" variant="secondary" className="mb-0">
                    CSVファイルを読み込む
                        <input
                        type="file"
                        className="d-none"
                        accept=".csv,text/csv,text/plain"
                        id="csv-file-input"
                        onChange={handleFileChange}
                    />
                </Button>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>キャンセル</Button>
                {
                    courseAndRecordPairs === undefined || codeColumnIndex === undefined ?
                        (<Button disabled>次へ</Button>) :
                        (<Button onClick={() => onSubmit({ courseAndRecordPairs, codeColumnIndex })}>次へ</Button>)
                }
            </Modal.Footer>
        </Modal>
    )
};

const CollectivelyCourseSetView: React.FC<{
    codeToCourse: ReadonlyMap<string, Course>,
    requirement: Requirements,
    idToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    plan: Plan,
    onSubmit: (plan: Plan) => void,
}> = ({ codeToCourse, requirement, idToRequirement, plan, onSubmit }) => {
    const [page, setPage] = useState<0 | 1 | 2 | undefined>();
    const [courseAndRecordPairs, setCourseAndRecordPairs] = useState<readonly CourseAndRecordPair[]>();
    const [codeColumnIndex, setCodeColumnIndex] = useState<number>();
    const [courseToStatus, setCourseToStatus] = useState<ReadonlyMap<Course, RegistrationStatus>>(new Map());

    return (
        <>
            <Button variant="secondary" onClick={() => setPage(0)}>CSVから履修状況を一括登録</Button>
            <Modal0
                codeToCourse={codeToCourse}
                show={page === 0}
                onCancel={() => setPage(undefined)}
                onSubmit={
                    ({ courseAndRecordPairs, codeColumnIndex }) => {
                        const nextCourseToStatus = new Map(courseToStatus);
                        for (const { course } of courseAndRecordPairs) {
                            if (course !== undefined && !nextCourseToStatus.has(course) && isRegistrable({ course, courseToStatus: nextCourseToStatus })) {
                                nextCourseToStatus.set(course, RegistrationStatus.Registered);
                            }
                        }
                        setCourseToStatus(nextCourseToStatus);
                        setCourseAndRecordPairs(courseAndRecordPairs);
                        setCodeColumnIndex(codeColumnIndex);
                        setPage(1);
                    }
                }
            />
            {
                courseAndRecordPairs === undefined || codeColumnIndex === undefined ? (<></>) : (
                    <Modal1
                        courseAndRecordPairs={courseAndRecordPairs}
                        codeColumnIndex={codeColumnIndex}
                        show={page === 1}
                        courseToStatus={courseToStatus}
                        setCourseToStatus={setCourseToStatus}
                        onCancel={() => setPage(0)}
                        onSubmit={() => setPage(2)}
                    />
                )
            }
            {
                courseToStatus === undefined ? (<></>) : (
                    <AssignmentsFindView
                        show={page === 2}
                        requirement={requirement}
                        idToRequirement={idToRequirement}
                        codeToCourse={codeToCourse}
                        plan={{ ...plan, courseToStatus }}
                        selectsAutomatically={true}
                        cancelButtonLabel="スキップ"
                        additionalInformation={
                            <p>スキップすると科目群への割り当てを行わず、履修状況の設定だけを行います。</p>
                        }
                        onCancel={
                            () => {
                                setPage(undefined);
                                onSubmit({ ...plan, courseToStatus });
                            }
                        }
                        onSubmit={
                            plan => {
                                setPage(undefined);
                                onSubmit(plan);
                            }
                        }
                    />
                )
            }
        </>
    )
}

export default CollectivelyCourseSetView;