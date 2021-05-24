import React, { useEffect, useRef, useState } from 'react';
import _ from 'lodash';
import {
    Row,
    Button
} from 'reactstrap';
import './feedback.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faEdit } from '@fortawesome/free-solid-svg-icons';


const FeedbackButton = props => {
    
    return (
        <Row>
            <div className="center">
                <a href={'https://github.com/schatzopoulos/SciNeM/issues/new'} target={'_blank'}>
                    <Button id="feedback-button" size='sm'>
                        <FontAwesomeIcon icon={faEdit} /> feedback
                    </Button>
                </a>
            </div>
        </Row>
    );
};


export default FeedbackButton;
