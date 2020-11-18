import React, { useCallback, useState } from 'react';
import { Button, ButtonToolbar, Form, Modal } from "react-bootstrap";
import Course from "./Course";
import getValueFromModal, { useModals } from './getValueFromModal';
import Plan, { emptyPlan, fromJSON, toJSON } from "./Plan";
import { RequirementWithCourses } from "./Requirements";
import safely from './safely';

const ImportConfirmationModal = ({ onReturn, onExited }: {
    onReturn: (value: boolean) => void,
    onExited: () => void
}) => {
    const [show, setShow] = useState(true);

    return (
        <Modal show={show} onHide={() => { setShow(false); onReturn(false); }} onExited={onExited}>
            <Modal.Header closeButton>
                <Modal.Title>バックアップの復元</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                復元すると現在の作業内容は失われますが、よろしいですか？
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => { setShow(false); onReturn(false); }}>いいえ</Button>
                <Button variant="danger" onClick={() => { setShow(false); onReturn(true); }}>はい</Button>
            </Modal.Footer>
        </Modal>
    );
}

const ImportView: React.FC<{
    codeToCourse: ReadonlyMap<string, Course>,
    idToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    onSubmit: (nextPlan: Plan) => void,
}> = ({ codeToCourse, idToRequirement, onSubmit }) => {
    const [jsonText, setJSONText] = useState("");
    const [validated, setValidated] = useState(false);
    const { modals, setModalsAndCount } = useModals();

    const json = safely(JSON.parse, jsonText);
    const nextPlan = json && safely(fromJSON, json, { codeToCourse, idToRequirement });
    const isInvalid = nextPlan === undefined;

    const handleJSONChange = useCallback((nextJSON: string) => {
        setJSONText(nextJSON);
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
                handleJSONChange(reader.result);
            }
        });
        reader.readAsText(file);
    }, [handleJSONChange]);

    const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (
            nextPlan === undefined ||
            !await getValueFromModal(ImportConfirmationModal, {}, setModalsAndCount)
        ) {
            return;
        }
        onSubmit(nextPlan);
    }, [nextPlan, onSubmit, setModalsAndCount]);

    return (
        <>
            {modals}
            <h5>バックアップの復元</h5>
            <p>
                保存したJSONデータをテキストボックスに貼り付けるか、ファイルとして読み込んでください。
                [復元] ボタンを押すと、<strong>現在の作業内容は失われ</strong>、入力されたバックアップが復元されます。
            </p>
            <Form onSubmit={handleSubmit}>
                <Form.Group>
                    <Form.Label>JSON</Form.Label>
                    <Form.Control
                        className="input-monospace"
                        isInvalid={validated && isInvalid}
                        value={jsonText}
                        placeholder={JSON.stringify(toJSON(emptyPlan))}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleJSONChange(event.target.value)}
                    />
                    <Form.Control.Feedback type="invalid">JSONの形式が不正です</Form.Control.Feedback>
                </Form.Group>
                <ButtonToolbar>
                    <Button type="submit" disabled={isInvalid}>復元</Button>
                    <Button as="label" variant="secondary" className="mb-0">
                        JSONファイルを読み込む
                        <input
                            type="file"
                            className="d-none"
                            accept=".json,application/json"
                            id="json-file-input"
                            onChange={handleFileChange}
                        />
                    </Button>
                </ButtonToolbar>
            </Form>
        </>
    );
}

export default ImportView;