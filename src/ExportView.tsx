import React, { useEffect, useState } from 'react';
import { Button, Form } from "react-bootstrap";
import Plan, { toJSON } from "./Plan";

const ExportView: React.FC<{ plan: Plan }> = ({ plan }) => {
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
    );
}

export default ExportView;