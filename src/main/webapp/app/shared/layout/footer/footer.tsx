import './footer.scss';

import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { Col, Row } from 'reactstrap';
import { faLink, faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';

const Footer = props => (
    <div className="footer page-content">
        <Row>
            <Col md="3" className={'text-left'}>
                <p>ATHENA Research Center &copy; 2021</p>
            </Col>
            <Col md='6'>
                <p>
                <small><u>Please cite:</u> S. Chatzopoulos, T. Vergoulis, P. Deligiannis, D. Skoutas, T. Dalamagas, C. Tryfonopoulos: <span style={{'fontWeight': 'bold'}}>SciNeM: A Scalable Data Science Tool for Heterogeneous Network Mining.</span> <i>In Proc. of the 24<sup>th</sup> International Conference on Extending Database Technology (EDBT)</i> 2021 <a href={'https://edbt2021proceedings.github.io/docs/p168.pdf'} target={'_blank'}><FontAwesomeIcon icon={faExternalLinkAlt} /></a></small>
                </p>
            </Col>
            <Col md={'3'} className={'text-right'}>
                <a href={'https://github.com/schatzopoulos/SciNeM'} target={'_blank'}><FontAwesomeIcon icon={faGithub} /> Link to code</a>
            </Col>
        </Row>
    </div>
);

export default Footer;
