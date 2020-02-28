import React, { useEffect, useState } from 'react';
import { Accordion, Button, Card, Form } from "react-bootstrap";
import Plan, { toJSON } from "./Plan";

const ExportView = ({ plan, eventKey }: {
    plan: Plan,
    eventKey: string,
}) => {
    const jsonText = JSON.stringify(toJSON(plan));
    const [url, setURL] = useState<string | undefined>();
    useEffect(() => {
        const blob = new Blob([jsonText], { type: 'application/json' });
        const reader = new FileReader();
        const onLoad = () => {
            const url = reader.result;
            if (typeof url === 'string') {
                setURL(url);
            }
        }
        reader.addEventListener('load', onLoad);
        reader.readAsDataURL(blob);
        return () => reader.removeEventListener('load', onLoad);
    }, [jsonText]);

    return (
        <Card>
            <Card.Header>
                <Accordion.Toggle eventKey={eventKey} variant="link" as={Button}>
                    エクスポート
                </Accordion.Toggle>
            </Card.Header>
            <Accordion.Collapse eventKey={eventKey}>
                <Card.Body>
                    <Form>
                        <Form.Group>
                            <Form.Label>JSON</Form.Label>
                            <Form.Control
                                readOnly className="input-monospace"
                                value={jsonText}
                                onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                            />
                        </Form.Group>
                        <Button as='a' href={url} download>保存</Button>
                    </Form>
                </Card.Body>
            </Accordion.Collapse>
        </Card>
    );
}

export default ExportView;