import React from 'react';
import { Button, Row, Col, Modal, ModalHeader, ModalBody } from 'reactstrap';
import EntityBox from './entity-box';
import EntityConnector from './entity-connector';
import EntityInsertionModal from './entity-insertion-modal';
import MetapathControl from './metapath-control';
import Recommendation from 'app/modules/metapath/recommendation';
import PredefinedMetapathBrowser from 'app/modules/metapath/predefined-metapath-browser';

interface MetapathPanelProps {
    constraints: any,
    datasetFolder: string,
    metapath: any
    schema: any
    selectField: string,
    selectFieldOptions: any
    onNewEntity: any
    onDelete: any
    onRecommendationAccept: any,
    handleSwitch: any,
    handleDropdown: any,
    handleLogicDropdown: any
    handleInput: any
    handleAddition: any
    handleRemoval: any
    handleSelectFieldChange: any
    handleMultipleAddition: any
    handlePredefinedMetapathAddition: any
}

class MetapathPanel extends React.Component<MetapathPanelProps> {
    readonly state = {
        entityModalOpen: false,
        predefinedMetapathsModalOpen: false
    };
    nodes = null;

    constructor(props) {
        super(props);
        if (this.props.schema) {
            this.nodes = this.getAvailableNodesFromSchema(this.props.schema);
        }
    }

    getAvailableNodesFromSchema(schema) {
        return schema.elements.filter(element => element.data.label !== undefined).map(element => {
            return { id: element.data.id, label: element.data.label };
        });
    }

    componentDidMount() {
        if (this.props.schema) {
            this.nodes = this.getAvailableNodesFromSchema(this.props.schema);
        }
    }

    componentDidUpdate() {
        if (this.props.schema) {
            this.nodes = this.getAvailableNodesFromSchema(this.props.schema);
        }
    }

    getMetapathRecommendation(metapathEntities) {
        const metapathString = this.props.metapath.filter(element => element.data('label') !== undefined).map(element => element.data('label')[0]).join('');
        const isSymmetric = (metapathStr) => metapathStr.substr(0, Math.floor(metapathStr.length / 2)).split('').reverse().join('') === metapathStr.substr(Math.ceil(metapathStr.length / 2));
        return isSymmetric(metapathString) ? [] : metapathEntities.slice(0, metapathEntities.length - 1).reverse();
    }

    toggleEntitySelectionModal() {
        this.setState({
            entityModalOpen: (!this.state.entityModalOpen)
        });
    }

    togglePredefinedMetapathsModal() {
        this.setState(
            {
                predefinedMetapathsModalOpen: (!this.state.predefinedMetapathsModalOpen)
            }
        )
    }

    render() {
        if (this.props.metapath && this.props.metapath.length > 0) {
            const idIndexedSchema = {};
            this.props.schema.elements.filter(element => element.data.label !== undefined).forEach(element => {
                idIndexedSchema[element.data.id] = element.data.label;
            });
            const metapathEntities = this.props.metapath.filter(element => element.data('label') !== undefined).map(element => element.data('id'));
            const metapathEntityBoxes = [];
            const metapathTypesSeen = [];
            const tempConstraints = { ...this.props.constraints };

            const recommendationList = this.getMetapathRecommendation(metapathEntities);
            metapathEntities.forEach(element => {
                if (metapathEntityBoxes.length > 0) {
                    metapathEntityBoxes.push(<EntityConnector />);
                }
                if (!metapathTypesSeen.includes(element)) {
                    metapathTypesSeen.push(element);
                    metapathEntityBoxes.push(
                        <EntityBox className='' color="dark" disabled entity={element}
                                   constraints={tempConstraints[idIndexedSchema[element]]}
                                   idIndexedSchema={idIndexedSchema}
                                   datasetFolder={this.props.datasetFolder}
                                   primaryEntity={metapathEntityBoxes.length === 0}
                                   selectField={this.props.selectField}
                                   selectFieldOptions={metapathEntityBoxes.length === 0 ? this.props.selectFieldOptions : null}
                                   handleSelectFieldChange={this.props.handleSelectFieldChange}
                                   handleSwitch={this.props.handleSwitch}
                                   handleDropdown={this.props.handleDropdown}
                                   handleLogicDropdown={this.props.handleLogicDropdown}
                                   handleInput={this.props.handleInput}
                                   handleAddition={this.props.handleAddition}
                                   handleRemoval={this.props.handleRemoval}
                                   handleMultipleAddition={this.props.handleMultipleAddition} />
                    );
                    delete tempConstraints[element];
                } else {
                    metapathEntityBoxes.push(
                        <EntityBox className='' color="dark" disabled entity={element} constraintsControl={false}
                                   idIndexedSchema={idIndexedSchema}
                                   datasetFolder={null} />
                    );
                }
            });
            return (
                <Row>
                    {metapathEntityBoxes}
                    <MetapathControl schema={this.props.schema} metapath={this.props.metapath}
                                     onNewEntity={this.props.onNewEntity} onDelete={this.props.onDelete} />
                    <Recommendation
                        recommendationEntities={recommendationList}
                        idIndexedSchema={idIndexedSchema}
                        onRecommendationAccept={this.props.onRecommendationAccept} />
                </Row>
            );
        } else if (this.nodes) {
            return (
                <Row className={'justify-content-start'}>
                    <Col xs={12}>
                        <Button outline color="dark" size="sm" onClick={this.toggleEntitySelectionModal.bind(this)}>Select starting
                            entity</Button>
                        {(this.state.entityModalOpen) &&
                        <EntityInsertionModal entities={this.nodes} onSelection={this.props.onNewEntity}
                                              onDismiss={this.toggleEntitySelectionModal.bind(this)} />}
                        <Button className={'ml-2'} outline color="dark" size="sm" onClick={this.togglePredefinedMetapathsModal.bind(this)}>Select a predefined
                            metapath</Button>
                        <Modal isOpen={this.state.predefinedMetapathsModalOpen} toggle={this.togglePredefinedMetapathsModal.bind(this)} className={'modal-lg'}>
                            <ModalHeader toggle={this.togglePredefinedMetapathsModal.bind(this)}>Select a predefined metapath</ModalHeader>
                            <ModalBody>
                                <PredefinedMetapathBrowser dataset={this.props.datasetFolder} handlePredefinedMetapathAddition={metapathEntities=>{
                                    this.setState({
                                        predefinedMetapathsModalOpen: false
                                    }, this.props.handlePredefinedMetapathAddition(metapathEntities));
                                }}/>
                            </ModalBody>
                        </Modal>
                    </Col>
                </Row>
            );
        } else {
            return (
                <Row>
                    <Col>

                    </Col>
                </Row>
            );
        }
    }
}

export default MetapathPanel;
