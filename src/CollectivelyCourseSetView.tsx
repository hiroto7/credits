import parse from 'csv-parse/lib/sync';
import React, { useState } from 'react';
import { Badge, Button, ButtonGroup, Form, Modal, OverlayTrigger, Table, Tooltip } from "react-bootstrap";
import Course from './Course';
import getValueFromModal, { useModals } from './getValueFromModal';
import { RegistrationStatus } from './Plan';
import safely from './safely';

const placeholder = `
"学籍番号","学生氏名","科目番号","科目名 ","単位数","春学期","秋学期","総合評価","科目区分","開講年度","開講区分"
"201700000","＊＊ ＊＊","GB10615","コンピュータリテラシ"," 2.0","-","-","A","A","2017","通常"
"201700000","＊＊ ＊＊","GB10664","プログラミング入門A"," 1.0","-","-","A","A","2017","通常"
`.trim();

type RegistrationStatus12 = RegistrationStatus.Registered | RegistrationStatus.Acquired

const CollectivelyCourseSetConfirmationModal = ({ onReturn, onExited }: {
    onReturn: (value: boolean) => void,
    onExited: () => void
}) => {
    const [show, setShow] = useState(true);

    return (
        <Modal show={show} onHide={() => { setShow(false); onReturn(false); }} onExited={onExited}>
            <Modal.Header closeButton>
                <Modal.Title>履修状態の一括登録</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                続けると、<strong>現在の履修 / 修得状態が失われます</strong>。
                よろしいですか？
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShow(false); onReturn(false); }}>いいえ</Button>
                <Button variant="danger" onClick={() => { setShow(false); onReturn(true); }}>はい</Button>
            </Modal.Footer>
        </Modal>
    );
}

const Table1: React.FC<{
    codeColumnIndex: number,
    titleColumnIndex: number | undefined,
    creditsCountColumnIndex: number | undefined,
    courseAndRecordPairs: readonly CourseAndRecordPair[],
    courseToStatus: ReadonlyMap<Course, RegistrationStatus12>,
    setCourseToStatus: (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => void,
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
                                    <tr key={recordIndex}>
                                        <td style={{ textAlign: 'center' }}>
                                            <OverlayTrigger
                                                overlay={
                                                    <Tooltip id={`record${recordIndex}-tooltip`}>この科目は見つかりません。</Tooltip>
                                                }
                                            >
                                                <Badge variant="secondary">?</Badge>
                                            </OverlayTrigger>
                                        </td>
                                        {tds}
                                    </tr>
                                )
                            } else {
                                const status = courseToStatus.get(course);
                                const nextStatus = status === RegistrationStatus.Acquired ? RegistrationStatus.Registered : RegistrationStatus.Acquired;
                                const variant = status === RegistrationStatus.Acquired ? 'success' : 'primary';

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
                                        className={`table-${variant}`}
                                    >
                                        <td style={{ textAlign: 'center' }}>
                                            <Badge variant={variant}>
                                                {status === RegistrationStatus.Acquired ? '修得済み' : '履修する'}
                                            </Badge>
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
    onHide: () => void,
    onBack: () => void,
    onSubmit: (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => void,
}> = ({ codeColumnIndex, courseAndRecordPairs, show, onHide, onBack, onSubmit }) => {
    const { modals, setModalsAndCount } = useModals();
    const [courseToStatus, setCourseToStatus] = useState<ReadonlyMap<Course, RegistrationStatus12>>(new Map());

    const titleColumnIndex = getColumnIndex(courseAndRecordPairs, course => course.title, recordTitle => recordTitle.trim());
    const creditsCountColumnIndex = getColumnIndex(courseAndRecordPairs, course => course.creditCount, recordCreditsCount => +recordCreditsCount)

    const handleOKClick = async () => {
        if (!await getValueFromModal(CollectivelyCourseSetConfirmationModal, {}, setModalsAndCount)) {
            return;
        }
        onSubmit(new Map(
            courseAndRecordPairs
                .map(({ course }) => course)
                .filter((course): course is NonNullable<typeof course> => course !== undefined)
                .map(course => [course, courseToStatus.get(course) ?? RegistrationStatus.Registered])
        ));
    };

    const setAllCourseStatus = (status: RegistrationStatus12) => {
        setCourseToStatus(new Map(
            courseAndRecordPairs
                .map(({ course }) => course)
                .filter((course): course is NonNullable<typeof course> => course !== undefined)
                .map(course => [course, status])
        ));
    }

    return (
        <>
            {modals}
            <Modal size="xl" show={show} onHide={onHide}>
                <Modal.Header closeButton>
                    <Modal.Title>履修状態の一括登録</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        CSVデータから見つかった科目が以下に表示されています。
                        それぞれの科目を [履修する] / [修得済み] のどちらかに設定し、 [OK] ボタンを押します。
                        <strong>現在の履修 / 修得状態は失われます。</strong>
                    </p>
                    <ButtonGroup className="mb-3">
                        <Button
                            variant="outline-primary"
                            onClick={() => setAllCourseStatus(RegistrationStatus.Registered)}
                        >
                            すべて履修する
                        </Button>
                        <Button
                            variant="outline-success"
                            onClick={() => setAllCourseStatus(RegistrationStatus.Acquired)}
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
                    <Button variant="secondary" onClick={onHide}>キャンセル</Button>
                    <Button variant="secondary" onClick={onBack}>戻る</Button>
                    <Button onClick={handleOKClick}>OK</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

const Modal0: React.FC<{
    codeToCourse: ReadonlyMap<string, Course>,
    show: boolean,
    onHide: () => void,
    onSubmit: ({ courseAndRecordPairs, codeColumnIndex }: {
        courseAndRecordPairs: readonly CourseAndRecordPair[],
        codeColumnIndex: number,
    }) => void,
}> = ({ codeToCourse, show, onHide, onSubmit }) => {
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

    const handleCSVChange = (nextCSV: string) => {
        setCSV(nextCSV);
        setValidated(true);
    }

    return (
        <Modal size="lg" show={show} onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>履修状態の一括登録</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p>
                    ひとつの列に履修 / 修得する科目の番号が記述されたCSVデータを用意します。
                </p>
                <ul>
                    <li>TWINS の [成績照会] 画面からダウンロードしたCSVファイルをそのまま使用できます。</li>
                    <li>科目番号のみを各行に記述したデータも使用できます。</li>
                </ul>
                <p>
                    用意したデータをテキストボックスに貼り付けるか、ファイルとして読み込みます。
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
                <Form.Group>
                    <Form.Label>CSVファイル</Form.Label>
                    <Form.File
                        custom
                        accept=".csv,text/csv,text/plain"
                        id="csv-file-input"
                        label="Choose file"
                        onChange={
                            (event: React.ChangeEvent<HTMLInputElement>) => {
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
                            }
                        }
                    />
                </Form.Group>
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
    onSubmit: (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => void,
}> = ({ codeToCourse, onSubmit }) => {
    const [page, setPage] = useState<number | undefined>();
    const [courseAndRecordPairs, setCourseAndRecordPairs] = useState<readonly CourseAndRecordPair[] | undefined>();
    const [codeColumnIndex, setCodeColumnIndex] = useState<number | undefined>();

    return (
        <>
            <Button variant="secondary" onClick={() => setPage(0)}>履修状態の一括登録</Button>
            <Modal0
                codeToCourse={codeToCourse}
                show={page === 0}
                onHide={() => setPage(undefined)}
                onSubmit={
                    ({ courseAndRecordPairs, codeColumnIndex }) => {
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
                        onHide={() => setPage(undefined)}
                        onBack={() => setPage(0)}
                        onSubmit={
                            (courseToStatus: ReadonlyMap<Course, RegistrationStatus12>) => {
                                onSubmit(courseToStatus);
                                setPage(undefined);
                            }
                        }
                    />
                )
            }
        </>
    )
}

export default CollectivelyCourseSetView;