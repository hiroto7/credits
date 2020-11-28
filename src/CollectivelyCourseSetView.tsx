import parse from 'csv-parse/lib/sync';
import { useCallback, useState } from 'react';
import { Badge, Button, ButtonGroup, Form, Modal, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import AssignmentsFindView from './AssignmentsFindView';
import { CourseRegistrationStatusBadge, DisabledCourseBadge } from './badges';
import type Course from './Course';
import Plan, { getNextStatus, isRegistrable, RegistrationStatus } from './Plan';
import RegistrationStatusLockTarget from './RegistrationStatusLockTarget';
import type Requirements from './Requirements';
import type { RequirementWithCourses } from './Requirements';
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
    courseAndRecordPairs: readonly [CourseAndRecordPair, ...CourseAndRecordPair[]],
    courseToStatus: ReadonlyMap<Course, RegistrationStatus>,
    setCourseToStatus: (courseToStatus: ReadonlyMap<Course, RegistrationStatus>) => void,
}> = ({ codeColumnIndex, titleColumnIndex, creditsCountColumnIndex, courseAndRecordPairs, courseToStatus, setCourseToStatus }) => {
    const {
        course: firstCourse,
        record: firstRecord,
    } = courseAndRecordPairs[0];

    const firstRecordIsHeader =
        firstCourse === undefined &&
        firstRecord[codeColumnIndex]!.trim() === '科目番号' &&
        (titleColumnIndex === undefined || firstRecord[titleColumnIndex]!.trim() === '科目名') &&
        (creditsCountColumnIndex === undefined || firstRecord[creditsCountColumnIndex]!.trim() === '単位数');

    const courseAndRecordPairsWithoutHeader: readonly CourseAndRecordPair[] = firstRecordIsHeader ?
        courseAndRecordPairs.slice(1) :
        courseAndRecordPairs;

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
                    courseAndRecordPairsWithoutHeader.map(
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
    readonly course: Course | undefined;
    readonly record: readonly string[];
}

const getColumnIndex = <T,>(
    courseAndRecordPairs: readonly [CourseAndRecordPair, ...CourseAndRecordPair[]],
    mapCourse: (course: Course) => T,
    mapRecord: (recordValue: string) => T
) =>
    courseAndRecordPairs[0].record
        .map((_, index) => courseAndRecordPairs.reduce((count, { course, record }) => {
            const recordValue = record[index]!;
            if (course !== undefined && mapRecord(recordValue) === mapCourse(course)) {
                return count + 1;
            } else {
                return count;
            }
        }, 0))
        .reduce<{
            count: number,
            index: number | undefined,
        }>((previous, current, index) => {
            if (current > previous.count) {
                return {
                    count: current,
                    index,
                }
            } else {
                return previous;
            }
        }, {
            count: 0,
            index: undefined,
        }).index;

const Modal1: React.FC<{
    codeColumnIndex: number,
    courseAndRecordPairs: readonly [CourseAndRecordPair, ...CourseAndRecordPair[]],
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
        courseAndRecordPairs: readonly [CourseAndRecordPair, ...CourseAndRecordPair[]],
        codeColumnIndex: number,
    }) => void,
}> = ({ codeToCourse, show, onCancel: onHide, onSubmit }) => {
    const [csv, setCSV] = useState("");
    const [validated, setValidated] = useState(false);

    const records: readonly (readonly string[])[] | undefined = safely(parse, csv);
    const { courseAndRecordPairs, codeColumnIndex } = records?.[0]?.reduce<{
        definedCoursesCount: number;
        courseAndRecordPairs: readonly [CourseAndRecordPair, ...CourseAndRecordPair[]] | undefined;
        codeColumnIndex: number | undefined;
    }>((previous, _, index) => {
        const courseAndRecordPairs = records.map(record => {
            const code = record[index]!;
            const course = codeToCourse.get(code.trim());
            return { record, course };
        }) as [CourseAndRecordPair, ...CourseAndRecordPair[]];
        const definedCoursesCount = courseAndRecordPairs.filter(({ course }) => course !== undefined).length;

        return definedCoursesCount > previous.definedCoursesCount ? {
            definedCoursesCount,
            courseAndRecordPairs,
            codeColumnIndex: index,
        } : previous;
    }, {
        definedCoursesCount: 0,
        courseAndRecordPairs: undefined,
        codeColumnIndex: undefined,
    }) ?? {
        courseAndRecordPairs: undefined,
        codeColumnIndex: undefined,
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
    const [courseAndRecordPairs, setCourseAndRecordPairs] = useState<readonly [CourseAndRecordPair, ...CourseAndRecordPair[]]>();
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