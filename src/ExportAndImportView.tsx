import React, { useState } from 'react';
import { Button, ButtonToolbar, Card, Form } from "react-bootstrap";
import Course from "./Course";
import Plan, { fromJSON, toJSON } from "./Plan";
import { RequirementWithCourses } from "./Requirements";

const ExportAndImportView = ({ plan, codeToCourse, nameToRequirement, onHide, onReturn }: {
    plan: Plan,
    codeToCourse: ReadonlyMap<string, Course>,
    nameToRequirement: ReadonlyMap<string, RequirementWithCourses>,
    onHide: () => void,
    onReturn: (nextPlan: Plan) => void,
}) => {
    const [jsonString, setJSONString] = useState(() => JSON.stringify(toJSON(plan)));

    const nextPlan = (() => {
        try {
            return fromJSON(
                JSON.parse(jsonString),
                { codeToCourse, nameToRequirement }
            );
        } catch {
            return undefined;
        }
    })();
    const isInvalid = nextPlan === undefined;

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (nextPlan === undefined) {
            return;
        }
        onReturn(nextPlan);
        onHide();
    };

    return (
        <Card>
            <Card.Header>エクスポート / インポート</Card.Header>
            <Card.Body>
                <dl>
                    <dt>エクスポート</dt>
                    <dd>テキストボックスの内容をコピーして、テキストファイルなどに保存します。</dd>

                    <dt>インポート</dt>
                    <dd>
                        テキストボックスに保存したテキストを貼り付けてから、 [インポート] ボタンを押します。
                        <strong>インポートすると現在の設定状態は失われます。</strong>
                    </dd>
                </dl>

                <Form onSubmit={handleSubmit}>
                    <Form.Group>
                        <Form.Label>JSON</Form.Label>
                        <Form.Control
                            className="input-monospace"
                            value={jsonString}
                            isInvalid={isInvalid}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJSONString(e.target.value)}
                            onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                        />
                        <Form.Control.Feedback type="invalid">JSONが不正です</Form.Control.Feedback>
                    </Form.Group>
                    <ButtonToolbar>
                        <Button variant="danger" type="submit" disabled={isInvalid}>
                            インポート
                        </Button>
                        <Button variant="secondary" onClick={onHide}>閉じる</Button>
                    </ButtonToolbar>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default ExportAndImportView