import './home.scss';

import React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import { 
	Row, 
	Col, 
	InputGroup, 
	InputGroupAddon, 
	Input, 
	Button, 
	Spinner,
	ListGroup,
	Progress,
	Container,
	Card, 
	UncontrolledCollapse,
	CustomInput, 
	CardBody,
	Label,
	CardTitle,
} from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IRootState } from 'app/shared/reducers';
import CytoscapeComponent from 'react-cytoscapejs';
import  _  from 'lodash';
import { 
	analysisRun,
	getStatus,
	getResults, 
	getMoreResults 
} from '../analysis/analysis.reducer';
import { getDatasetSchemas } from '../datasets/datasets.reducer';
import ResultsPanel from '../analysis/results/results';
import ConstraintItem from '../constraints/constraint-item';
import { __metadata } from 'tslib';
import AutocompleteInput from '../datasets/autocomplete-input';
import { NavLink } from 'reactstrap';

export interface IHomeProps extends StateProps, DispatchProps {
	loading: boolean;
	progress: number;
	progressMsg: string;
	error: string;
	docs: any;
	meta: any;
	uuid: string;
};

export class Home extends React.Component<IHomeProps> {
	readonly state: any = { 
		metapath: [],
		metapathStr: '',
		neighbors: undefined,
		constraints: {},
		analysis: ["Ranking"],
		dataset: "DBLP",
		selectField: '',
		targetEntity: '',

		edgesThreshold: 5,
		prTol: 0.000001,
		prAlpha: 0.5,
		joinK: 100,
		joinW: 0,
		joinMinValues: 5,
		searchK: 100,
		searchW: 10,
		searchMinValues: 5,
	};
	cy: any;
	polling: any;
	
	validMove(node) {
		// allow first move to be anywhere
		if (!this.state.neighbors) {
			return true;
		}

		return this.state.neighbors.contains(node);
	}

	animateNeighbors(node) {
		const nodes = this.cy.filter('node');

		// metapath was reset, so we can move to all nodes
		if (!node) {
			this.setState({
				neighbors: undefined,
			}, () => {
				nodes.animate({
					style: { 'background-color': 'grey', 'border-width': '0px' }
				});
			});
			return;
		}

		node.animate({
			style: { 'background-color': 'green' },
		});
		
		const neighbors = node.neighborhood();

		nodes.not(neighbors).animate({
			style: { 'border-width': '0px' }
		}); 

		nodes.not(node).animate({
			style: { 'border-width': '0px', 'background-color': 'grey' }
		});

		neighbors.animate({
			style: { 'border-color': 'red', 'border-width': '2px' },
			
		});

		this.setState({
			neighbors
		});
	}

	pollForResults() {
		this.polling = setInterval( () => {
			this.props.getStatus(this.props.uuid);
		}, 1000);
	}

	componentDidUpdate(prevProps) {

		// new uuid detected, start polling
		if (this.props.loading && !prevProps.loading) {
			this.pollForResults();
		} else if (prevProps.loading && !this.props.loading) {
			clearInterval(this.polling);
		}

		_.forOwn(this.props.status, (completed, analysis) => {
			if (completed && prevProps.status && ! prevProps.status[analysis]) {
				this.props.getResults(analysis, this.props.uuid);
			}
		});

		if (!prevProps.schemas && this.props.schemas) {
			this.initCy();
		}

	}

	componentWillUnmount() {
		clearInterval(this.polling);
	}

	componentDidMount() {
		if (!this.props.schemas) {
			this.props.getDatasetSchemas();
		}		
		
		if (this.cy) { 
			this.initCy();
		}
	}
	tapNode(e) {
			
		const node = e.target;

		if (!this.validMove(node)) {
			alert("This selection is not allowed, please select on of the nodes denoted with green color");
			return;
		}

		// set metapath
		const metapath = [...this.state.metapath];	// copy array
		metapath.push(node);
		const metapathStr = metapath.map(n => n.data('label').substr(0,1)).join('');

		// set constraints 
		const constraints = {...this.state.constraints};
		// const attrs = node.data('attributes').filter(n => (n.name !== 'id'));
		_.forOwn(node.data('attributes'), (value) => {
			const entity = node.data('label');
			const field = value.name;

			// create constraints for node, if not already present
			if ( !(entity in constraints) || !(field in constraints[entity])) {
				this.checkAndCreateConstraints(constraints, { 
					entity, 
					field, 
				}, value.type);
			}
		});

		const newState = { ... this.state };
		newState.metapath = metapath;
		newState.metapathStr = metapathStr;
		newState.constraints = constraints;

		// select first attribute from the options
		if (this.state.selectField === '') {
			newState.selectField = node.data('attributes').filter( (attr) => attr.name !== 'id')[0].name;
		}

		this.setState(newState, () => {
			this.animateNeighbors(node);
		});
		
	}
	initCy() {
		// center align graph 
		this.cy.center();

		// init all nodes with grey color
		const nodes = this.cy.filter('node');
		nodes.animate({
			style: { 'background-color': 'grey', 'border-width': '0px' }
		}); 

		// change state and animate on node click
		this.cy.on('tap', 'node', (e) => this.tapNode(e) );
	}
	
	/**
	 * Delete last character of the metapath
	 */
	deleteLast() {

		const metapath = [...this.state.metapath];	// copy array
		metapath.pop();
		const metapathStr = metapath.map(n => n.data('label').substr(0,1)).join('');

		const node = metapath[metapath.length-1];

		// keep constraints for nodes that are in the metapath
		const constraints = {};
		_.forOwn(this.state.constraints, (entityConstraint, entity) => {
			const e = entity.substr(0, 1);
			if (metapathStr.includes(e)) {
				constraints[entity] = entityConstraint;
			}
		});
		
		const newState = { ... this.state };
		newState.metapath = metapath; 
		newState.metapathStr = metapathStr;
		newState.constraints = constraints;

		// clear select field when metapath is deleted
		if (metapath.length === 0) {
			newState.selectField = '';
		}

		this.setState(newState, () => {
			this.animateNeighbors(node);
		});	
	}

	checkAndCreateConstraints(constraints, { entity, field }, type=null) {
		if (! (entity in constraints)) {
			constraints[entity] = {};
		}

		// create object for attribute, if not present
		if (! (field in constraints[entity])) {
			constraints[entity][field] = {
				nextIndex: 0,
				enabled: true,
				type,
				conditions: [],
			};
		} 
		
		const index = constraints[entity][field]['nextIndex'];
		constraints[entity][field]['nextIndex'] += 1;

		const found = constraints[entity][field]['conditions'].includes(c => c.index === index);
		if (!found) {
			constraints[entity][field]['conditions'].push({
				index,
				value: null,
				operation: '=',
				logicOp: (index > 0) ? 'or' : undefined,
			});		
		}
	}

	handleConstraintOpDropdown({ entity, field, index }, value) {
		const constraints = {...this.state.constraints};
		const found = constraints[entity][field]['conditions'].find(c => c.index === index);
		if (found) {
			found['operation'] = value;
		}

		this.setState({
			constraints 
		});
	}

	getSelectFieldOptions() {
		if (this.state.metapath.length === 0) {
			return { selectedEntity: '', selectFieldOptions: [] };
		}

		const selectFieldOptions = [];
		const firstNode = this.state.metapath[0];

		const selectedEntity = firstNode.data('label');
		_.forOwn(firstNode.data('attributes'), (value, key) => {
			if (value.name !== 'id') {
				selectFieldOptions.push(
					<option key={key} value={value.name}>{value.name} (:{value.type})</option>
				);
			}
		});

		return { selectedEntity, selectFieldOptions };
	}
	handleConstraintLogicOpDropdown({ entity, field, index }, value) {
		const constraints = {...this.state.constraints};
		const found = constraints[entity][field]['conditions'].find(c => c.index === index);
		if (found) {
			found['logicOp'] = value;
		}

		this.setState({
			constraints 
		});
	}

	handleConstraintInputChange({ entity, field, index }, value) {
		
		const constraints = {...this.state.constraints};

		const found = constraints[entity][field]['conditions'].find(c => c.index === index);
		if (found) {
			found['value'] = value;
		}

		this.setState({
			constraints 
		});
	}

	handleConstraintAddition({ entity, field, index }) {
		const constraints = {...this.state.constraints};

		this.checkAndCreateConstraints(constraints, { entity, field});
		this.setState({
			constraints,
		});
	}

	handleConstraintRemoval({ entity, field, index }) {
		const constraints = {...this.state.constraints};

		constraints[entity][field]['conditions'] = constraints[entity][field]['conditions'].filter(n => n.index !== index);
		this.setState({
			constraints,
		});
	}

	execute(e, rerunAnalysis) {
		
		const analysisType = (rerunAnalysis) ? rerunAnalysis : this.state.analysis;

		this.props.analysisRun(
			analysisType,
			this.state.metapathStr,
			this.getJoinPath(),
			this.state.constraints, 
			this.props.schemas[this.state.dataset]['folder'],
			this.state.selectField,
			this.state.targetEntity,
			this.state.edgesThreshold,
			this.state.prAlpha,
			this.state.prTol,
			this.state.joinK,
			this.state.joinW,
			this.state.joinMinValues,
			this.state.searchK,
			this.state.searchW,
			this.state.searchMinValues,
			(rerunAnalysis) ? 15 : undefined,
			(rerunAnalysis) ? 1 : undefined,
		);
	}
	runExample(e) {

		const newState = { ... this.state };

		const nodes = this.cy.filter('node');

		switch(this.state.analysis) {
			case 'ranking': {
				const node = nodes.select('label=MiRNA');

				newState.dataset = 'Bio';
				newState.metapathStr = "MGDGM";
				newState.selectField = "name";
				newState.constraints = {"Disease":{"name":{"nextIndex":1,"enabled":true,"type":"string","conditions":[{"index":0,"value":"Adenocarcinoma","operation":"="}]}}};
				break;
			}
			case 'simjoin':
				newState.dataset = 'DBLP';
				newState.metapathStr = "VPTPV";
				newState.selectField = "name";
				break;
			case 'simsearch':
				newState.dataset = 'DBLP';
				newState.metapathStr = "VPAPV";
				newState.selectField = "name";
				newState.targetEntity = 360;
				break;
			default:
				alert("This type of analysis will be implemented soon");
		}

		this.setState(newState, () => {
			this.changeSchema(); 
			this.execute(e, null);
		});
	}
	loadMoreResults(analysis, nextPage) {
		this.props.getMoreResults(analysis, this.props.uuid, nextPage);
	}

	handleAnalysisDropdown(e) {
		this.setState({
			analysis: e.target.value,
			targetEntity: '',
		});
	}
	
	onCheckboxBtnClick (selected)  {
		const newState = { ...this.state };

		const index = newState.analysis.indexOf(selected);
		if (index < 0) {
			newState.analysis.push(selected);
		} else {
			newState.analysis.splice(index, 1);
		}
		this.setState(newState);
	  }

	handleConstraintSwitch({ entity, field }) {
		// create object for entity, if not present
		const constraints = {...this.state.constraints};
		
		constraints[entity][field]['enabled'] = !constraints[entity][field]['enabled'];

		this.setState({
			constraints 
		});
	}

	checkMetapathLength() {
		const metapath = this.state.metapathStr;

		return (metapath.length >= 3);
	}
	getJoinPath() {
		const metapath = this.state.metapathStr;	
		const midPos = Math.ceil(metapath.length / 2);
		return metapath.substr(0, midPos);
	}
	reverseString(str) {
		const splitString = str.split("");
		const reverseArray = splitString.reverse();
		const joinArray = reverseArray.join("");
		return joinArray;
	}
	checkSymmetricMetapath() {
		
		const metapath = this.state.metapathStr;	

		if (metapath.length < 3 || metapath.length % 2 === 0)
			return false;

		// CHECKS MATCHING FIRST AND LAST CHARACTER
		// const firstLetter = metapath.substr(0, 1);
		// const lastLetter = metapath.substr(metapath.length-1, 1);

		// if (firstLetter !== lastLetter)
		// 	return false;
		
		const midPos = Math.ceil(metapath.length / 2);

		const firstHalf = metapath.substr(0, midPos-1);
		const lastHalf = metapath.substr(midPos, metapath.length-1);
		// console.log("first " + firstHalf);
		// console.log("last " + lastHalf);
		
		return ( firstHalf === this.reverseString(lastHalf) );
	}

	checkConstraints() {
		if (this.state.analysis === 'simjoin' || this.state.analysis === 'simsearch')
			return true;

		const constraints = {};
		_.forOwn(this.state.constraints, (entityConstraint, entity) => {
			const e = entity.substr(0, 1);
			let entityConditions = [];
		
			_.forOwn(entityConstraint, ({ enabled, type, conditions }, field) => {
				if (enabled) {
					entityConditions = conditions
					.filter(element => element.value)
					.map(element => {
						let value;
						if (type === 'numeric') {
							value = parseInt(element.value, 10);
						} else {
							value = `'${element.value}'`;
						}
						return `${element.logicOp || ''} ${field} ${element.operation} ${value}`;
					});
				}
			
				if (entityConditions.length > 0) {
					constraints[e] = entityConditions.join(' ');
				}
			});
		});
		
		return !_.isEmpty(constraints);
	}

	getSchema() {
		const style = { 
			width: '100%', 
			height: '200px',
		};

		const layout = { 
			name: 'cose',
			animate: false,
		};

		let elements;
		if (this.props.schemas) { 
			elements = this.props.schemas[this.state.dataset]['elements'];
		}

		let schema;
		if (elements) {
			schema = <CytoscapeComponent cy={ (cy) => { this.cy = cy } } elements={elements} style={style} layout={layout} zoomingEnabled={false} />;
		} else {
			schema = <Spinner style={{ width: '200px', height: '200px', marginLeft: 'auto', marginRight: 'auto' }} type="grow" color="info" />;
		}

		return schema;
	}
	changeSchema() {

		const elements = this.props.schemas[this.state.dataset]['elements'];

		this.cy.elements().remove(); 
		this.cy.add(elements)
		const newLayout = this.cy.layout({ 
			name: 'cose',
			animate: false,
		});
		newLayout.run();
		this.cy.center();

	}
	resetSchemaColors() {
		const nodes = this.cy.filter('node');

		nodes.animate({
			style: { 'border-width': '0px', 'background-color': 'grey' }
		});
	}
	handleDatasetDropdown(e) {
		e.preventDefault();

		const newState = { ...this.state };
		newState.metapath = [];
		newState.metapathStr = '';
		newState.neighbors = undefined;
		newState.constraints = {};
		newState.selectField = '';
		newState.dataset = e.target.value;

		this.setState(newState, () => {	
			this.changeSchema();
			this.resetSchemaColors();
		});
	}
	getDatasetOptions() {
		let options = [];
		if (this.props.schemas) {
			options = _.map(this.props.schemas, (value, key) => {
				return <option key={key} value={key}>{key}</option>;
			});
		}
		return options;
	}
	handleSelectFieldChange(e) {
		e.preventDefault();

		const newState = { ...this.state };
		newState.selectField = e.target.value;
		this.setState(newState);
	}
	handleTargetEntity(e) {

		let selected;

		if (_.isEmpty(e)) {
			selected = '';
		} else {
			[selected] = e;
			selected = selected.id;
		}

		this.setState({
			targetEntity: selected,
		});
	}
	handleAdvancedOptions(e) {
		const newState = {...this.state};
		newState[e.target.id] = e.target.value;
		this.setState(newState);
	}
	render() {

		const datasetOptions = this.getDatasetOptions();
		const schema = this.getSchema();
		const validMetapathLength = this.checkMetapathLength();
		const validMetapath = this.checkSymmetricMetapath();
		const validConstraints = this.checkConstraints();
		const validAnalysisType = this.state.analysis.length !== 0;
		const validTargetEntity = (this.state.analysis !== 'simsearch') || (this.state.analysis === 'simsearch' && this.state.targetEntity !== '');
		const { selectedEntity, selectFieldOptions }: any = this.getSelectFieldOptions();
		
		let datasetFolder = '';
		if (this.props.schemas) {
			datasetFolder = this.props.schemas[this.state.dataset]['folder'];
		}

		const constraintsPanel = <Row>
		<Col md="12">
			<h4>Select constraints</h4>
		</Col>
		<Col md="12">
			{
				<ListGroup>
					{
						(this.state.metapathStr.length > 0) ?
						_.map(this.state.constraints, (entityConstraints, entity) => {
							return <ConstraintItem 
								key={ entity }
								datasetFolder= { datasetFolder }
								entity={ entity }
								entityConstraints={ entityConstraints }
								handleSwitch={this.handleConstraintSwitch.bind(this)}
								handleDropdown={this.handleConstraintOpDropdown.bind(this)}
								handleLogicDropdown={this.handleConstraintLogicOpDropdown.bind(this)}
								handleInput={this.handleConstraintInputChange.bind(this)}
								handleAddition={this.handleConstraintAddition.bind(this)}
								handleRemoval={this.handleConstraintRemoval.bind(this)}

							/>;
						})
						: 'No constraints can be applied'
					}
					</ListGroup>
			}
			{
				(!validConstraints && (this.state.metapathStr.length !== 0)) &&
				<span className="attribute-type text-danger">
					Please provide at least one constraint.
				</span>
			}
		</Col>
		</Row>;
		const rankingLabel = <span>
			Ranking <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Ranking analysis is perfomed using PageRank."/>
		</span>;
		const communityLabel = <span>
			Community Detection <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Community Detection analysis is perfomed using Louvain Modularity method."/>
		</span>;
		const simJoinLabel = <span>
			Similarity Join <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Similarity Join is perfomed using JoinSim."/>
		</span>;
		const simSearchLabel = <span>
			Similarity Search <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Similarity Search is perfomed using JoinSim similarity measure."/>
			
		</span>;

		return (
			<Container fluid>
			<Row>
				<Col md="6">
					<Row>
						<Col md="12">
							<Row>
								<Col md='8'>
									<h4>Select dataset</h4>		
								</Col>
								<Col md='4'>	
									<Button outline color="info" tag={Link} to="/upload" className="float-right" size='sm'>
										<FontAwesomeIcon icon="upload" /> Upload new
									</Button>
								</Col>
							</Row>
							<Input value={this.state.dataset} type="select" name="dataset" id="dataset" onChange={this.handleDatasetDropdown.bind(this)}>
								{ datasetOptions }
							</Input>
						</Col>
					</Row>
					<br/>

					<h4>Select metapath</h4>
					<Card className="mx-auto">		
						{ schema }
					</Card>

					<br/>
					<Row>
						<Col md='6' style={{'textAlign': 'center'}}>
							<h5>Current metapath</h5>
							<InputGroup>
								<Input placeholder="Select nodes on the graph to define the metapath" value={this.state.metapathStr} disabled={true}/>
								<InputGroupAddon addonType="append">
									<Button color="danger" title="Delete last node" onClick={this.deleteLast.bind(this)} ><FontAwesomeIcon icon="arrow-left" /></Button>
								</InputGroupAddon>
							</InputGroup>
							{
								((!validMetapathLength || !validMetapath) && this.state.metapathStr.length !== 0) &&
									<span className="attribute-type text-danger">Please insert a valid metapath (metapaths should be symmetric { (this.state.dataset === 'DBLP' || this.state.dataset === 'Bio') && "e.g."} { this.state.dataset === 'DBLP' && "APA" }{ this.state.dataset === 'Bio' && "MGDGM" })</span>
							}		
						</Col>
						{
							(selectedEntity) &&
							<Col md='6' style={{'textAlign': 'center'}}>
								<h5>Identifier for { selectedEntity } <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Entities are presented with this attribute in the results"/></h5>
								<Input id="select-field-dropdown" type="select" value={this.state.selectField} onChange={this.handleSelectFieldChange.bind(this)} disabled={this.state.metapath.length === 0}>
									{ selectFieldOptions }
								</Input>
							</Col>
						}
					</Row>
				</Col>
				<Col md="6">
					
					{
						constraintsPanel		
					}

					<br/>
					<h4>Select analysis type</h4>
					<Col md='12'>
						<Row>
							<CustomInput type="switch" id="rankingSwith" onChange={() => this.onCheckboxBtnClick("Ranking")} checked={this.state.analysis.includes("Ranking")} label={rankingLabel} />
						</Row>
						<Row>
							<CustomInput type="switch" id="cdSwitch" onChange={() => this.onCheckboxBtnClick("Community Detection")} checked={this.state.analysis.includes("Community Detection")} label={communityLabel} />
						</Row>
						<Row>
							<CustomInput type="switch" id="simJoinSwitch" onChange={() => this.onCheckboxBtnClick("Similarity Join")} checked={this.state.analysis.includes("Similarity Join")} label={simJoinLabel} />
						</Row>
						<Row>
							<Col md='6'>
								<Row>
							<CustomInput type="switch" id="simSearchSwitch" onChange={() => this.onCheckboxBtnClick("Similarity Search")} checked={this.state.analysis.includes("Similarity Search")} label={simSearchLabel} />
							</Row>
							</Col>
							{
							(this.state.analysis.includes("Similarity Search")) &&
								<span>
									<AutocompleteInput 
										id="targetEntityInput"
										placeholder={ _.isEmpty(this.state.metapath) ? "First, select a metapath" : `Search for ${selectedEntity} entities`}
										onChange={this.handleTargetEntity.bind(this)}								
										entity={selectedEntity}
										field={this.state.selectField}
										folder={datasetFolder}
										disabled={_.isEmpty(this.state.metapath)}
										size='sm'
									/>
								</span>
							}
						</Row>
					
						{
							(!validAnalysisType) &&
								<span className="attribute-type text-danger">
									Please select at least one type of analysis.
								</span>
						}
					</Col>
					<br/>
					
				</Col>
				<Col md='12'>

				<UncontrolledCollapse toggler="#toggler">
					<br/>
					<Row>
						<Col md={{offset: 2, size: 8}}>
							<Card block outline color='info'>
								<CardBody>

									<CardTitle><h5>Advanced Options</h5></CardTitle>
									<Row>
										<Col md='6'>
											<Card block >
											<h5>General</h5>

											<Label for="edgesThreshold">
												Min. support threshold for graph edges
											</Label>
											<Input id="edgesThreshold" value={this.state.edgesThreshold} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.edgesThreshold === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											</Card>
										</Col>
										<Col md='6'>
											<Card block >
											<h5>Ranking</h5>
											<Label for="edgesThreshold">
												Alpha
											</Label>
											<Input id="prAlpha" value={this.state.prAlpha} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.prAlpha === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											<br/>
											<Label for="edgesThreshold">
												Tolerance
											</Label>
											<Input id="prTol" value={this.state.prTol} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.prTol === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											</Card>
										</Col>
									</Row>
									<br/>
									<Row>
										<Col md='6'>
											<Card block >
											<h5>Similarity Join</h5>

											<Label for="joinK">
												k <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Number of retrieved results."/>
											</Label>
											<Input id="joinK" value={this.state.joinK} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.joinK === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											<br/>
											<Label for="joinW">
												w <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Hamming distance threshold for merging buckets."/>
											</Label>
											<Input id="joinW" value={this.state.joinW} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.joinW === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											<br/>
											<Label for="joinMinValues">
												Min. values <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Min number of values for each entity."/>
											</Label>
											<Input id="joinMinValues" value={this.state.joinMinValues} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.joinMinValues === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											</Card>

										</Col>
										<Col md='6'>
											<Card block >
											<h5>Similarity Search</h5>

											<Label for="searchK">
												k <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Number of retrieved results."/>
											</Label>
											<Input id="searchK" value={this.state.searchK} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.searchK === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											<br/>
											<Label for="searchW">
												w <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Hamming distance threshold for merging buckets."/>
											</Label>
											<Input id="searchW" value={this.state.searchW} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.searchW === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											<br/>
											<Label for="searchMinValues">
												Min. values <FontAwesomeIcon style={{ color: '#17a2b8' }} icon="question-circle" title="Min number of values for each entity."/>
											</Label>
											<Input id="searchMinValues" value={this.state.searchMinValues} bsSize="sm" type='number' onChange={this.handleAdvancedOptions.bind(this)}/>
											{
												(this.state.searchMinValues === '') &&
												<span className="attribute-type text-danger">
													This field cannot be empty.
												</span>
											}
											</Card>

										</Col>
									</Row>
								</CardBody>
							</Card>

						</Col>
					</Row>
					<br/>
				</UncontrolledCollapse>
				</Col>
				<br/>
				<Col md='12'>
					<Row>
						<Col md='1'>
							<Button outline color="info" id="toggler" title="Advanced Options">
								<FontAwesomeIcon icon="cogs" /> 
							</Button>	
						</Col>
						<Col md={{ size: 2, offset: 4 }}>
							<Button block color="success" disabled={this.props.loading || !validMetapath || !validConstraints || !validTargetEntity} onClick={this.execute.bind(this)}>
								<FontAwesomeIcon icon="play" /> Execute analysis
							</Button>
						</Col>
					</Row>
				</Col>
								

				<Col md='12'>
					<Container>
					<br/>
					{
						(this.props.loading) &&
						<Row className="small-grey text-center">
							<Col>
							The analysis may take some time, you can check its progress in the following <Link to={`/jobs/${this.props.uuid}`} target="_blank">link</Link> (job id = {this.props.uuid}).<br/>
							{this.props.description}
							</Col>
						</Row>
					}
					{
						(this.props.loading) && <Progress animated color="info" value={this.props.progress}>{this.props.progressMsg}</Progress>
					}
					<ResultsPanel 
						uuid={this.props.uuid}
						results={this.props.results}
						analysis={this.props.analysis}
						analysisId={this.props.uuid}
						loadMore={this.loadMoreResults.bind(this)}
						rerun={this.execute.bind(this)}
					/>
					</Container>
				</Col>
			</Row>
			</Container>
		);
	}
};

const mapStateToProps = (storeState: IRootState) => ({  
	loading: storeState.analysis.loading,
	status: storeState.analysis.status,
	progress: storeState.analysis.progress,
	progressMsg: storeState.analysis.progressMsg,
	description: storeState.analysis.description,
	error: storeState.analysis.error,
	results: storeState.analysis.results,
	uuid: storeState.analysis.uuid,  
	analysis: storeState.analysis.analysis,
	schemas: storeState.datasets.schemas,
});

const mapDispatchToProps = { 
	analysisRun,
	// simjoinRun,
	// simsearchRun,
	getStatus,
	getResults,
	getMoreResults,
	getDatasetSchemas,
};

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = typeof mapDispatchToProps;

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(Home);



