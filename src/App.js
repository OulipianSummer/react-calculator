import React from "react";
import { Button, Col, Row, Card, Container } from "react-bootstrap";
import "./App.css";
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      display: "0",
    };
    this.handleKeyPress = this.handleKeyPress.bind(this);
     
    // Construct a keys object that can help pair keys to actions
    const keys = {};
    for(let category in this.buttons){
       const buttonData = this.buttons[category];
       if(Array.isArray(buttonData)){
         buttonData.forEach(button => {
            if(Array.isArray(button.key)){
              button.key.forEach(key => {
                Object.defineProperty(keys, String(key), {
                  value: button.operation
                });
              });
   
            } else {
              Object.defineProperty(keys, String(button.key), {
                value: button.operation
              });
            }
         });
       } else {
         if(Array.isArray(buttonData.key)){
           buttonData.key.forEach(key => {
            Object.defineProperty(keys, String(key), {
              value: buttonData.operation
            });
           })
         } else {
            Object.defineProperty(keys, String(buttonData.key), {
              value: buttonData.operation
            });
         }

       }
    }

    this.keys = keys;
  }

  // Reduce actions into concrete behavior and state changes
  dispatch = (action, value = null) => {
    
    switch (action) {
      // Handle numpad keys
      case "VALUE":
          this.handleValue(value);
        break;
        
      case "ADD":
        this.injectOperand('+');
        break;
        
      case "NEGATE":
        this.makeNegative();
        break;

      case "SUBTRACT":
        this.injectOperand('-');
        break;

      case "MULTIPLY":
        this.injectOperand('*');
        break;

      case "DIVIDE":
        this.injectOperand('/');
        break;

      case "DECIMAL":
        if(!this.state.display.includes('.')){
          this.setState({display: this.state.display + '.'});
        }
        break;

      case "CLEAR":
        this.resetState();
        break;

      case "CALCULATE":
        this.calculate();
        break;
    }
  };
  
  componentDidMount(){

    // Handle virtual keypress events
    document.addEventListener('keypress', (event) => {
      event.preventDefault();
      const op = this.keys[event.key];
      if(op){
        this.dispatch(op, event.key);
      }
    });


}
  
  // Handle numeric value input. Must allow for multiple button inputs to build a single number
  handleValue = (value) => {
    
    // Reset the current operand
    this.currentOp = '';

    // Don't allow values to begin with 0 unless they are decimals
    if(this.state.display[0] === '0' && this.mode !== App.modes.over && !this.state.display.includes('.')){
      this.mode = App.modes.over;
    }

    // Insert mode
    if(this.mode === App.modes.ins){
      this.setState({display: this.state.display + value});
    }

    // Overwrite mode
    if(this.mode === App.modes.over){
      this.setState({display: value});
    }

    // Negative mode
    if(this.mode === App.modes.neg){
      this.setState({display: '-' + value});
    }
    
    // After any number input, switch to insert mode. This allows for more numbers to be strung together into a single value
    this.mode = App.modes.ins;
  }

  // Toggle positive/negative on the current number
  makeNegative = () => {
    
    let currentDisplay = this.state.display;
    
    // Toggle to negative
    if(currentDisplay !== '0' && currentDisplay[0] !== '-'){
      this.setState({display: '-' + currentDisplay}); 
      return;
    }
    
    // Toggle to positive
    if(currentDisplay[0] === '-'){
      currentDisplay = currentDisplay.slice(1);
      this.setState({display: currentDisplay});
    }
    
  }
  
  // Handle physical button clicks
  handleKeyPress = (event) => {    
    let key = String(event.target.dataset.trigger);
    key = String(key.split(',')[0]);
    const op = this.keys[key];
    this.dispatch(op, key);
    return;
  };
  
  // Reset the calculator
  resetState = () => {
    this.setState({display: "0"});
    this.currentOp = '';
    this.calcString = '';
    this.lastSum = '';
    this.mode = App.modes.over;
    return;
  }
  
  // Add an operand to the current math string
  injectOperand(op){
  
    // Skip reinitialization of the same operand
    if(op === this.currentOp){
      return;
    }
   
    // Handle init for this.currentOp
    if(this.currentOp === ''){
      this.currentOp = op;
    } else {
      
      // Expect that the next value entry should be negative
      if(op === '-' && this.mode !== App.modes.neg){
        this.mode = App.modes.neg;
      } else {
        this.currentOp = op;
        this.mode = App.modes.over;
      }
    }
    
    // Add the current display value to the calcstring
    if(this.mode === App.modes.ins){
      this.calcString += this.state.display + this.currentOp;
    }
    
    // If the user just pressed an operand, change the last current operand in the calcString
    if(this.mode === App.modes.over){
      const droppedOp = this.calcString.substring(0, this.calcString.length -1);
      this.calcString = droppedOp + this.currentOp;
    }
    
      
     // Set the current mode to override. This allows users to write over the display on their next input
    if(this.mode !== App.modes.neg){
      this.mode = App.modes.over;
    }   

  }
  
  // Get the current display value, add it to the calc string, and calculate the current equasion
  calculate(){
    let display = this.state.display;
    let calcString = this.calcString;
    console.log(calcString);
    if(display === "0" && calcString === ""){return;}

    // If the user input a value before pressing "=" add it to the current calcString
    if(this.mode === App.modes.ins){
      calcString += display;
    }
    
    // Sanitize -- and ++ characters to avoind invalid increment/decrement error
    calcString = calcString.replace('--', '- -');
    calcString = calcString.replace('++', '+');
    

    // If the user carelessly typeed 3+2* and then pressed "=", drop the last operand
    const lastChar = calcString.slice(-1);
    const ops = "+-*/"
    if(this.mode === App.modes.over && ops.includes(lastChar)){
      calcString = calcString.substring(0, calcString.length -1)
    }
    
    // Handle serial calculations 
    const firstChar = calcString[0];
    if(ops.includes(firstChar) && this.lastSum !== ''){
      calcString = this.lastSum + calcString ;
    }
    
    let value = eval(calcString);

    // Show the calculated value, and prepare the calculator for serial input
    this.setState({display: String(value)});
    this.calcString = '';
    this.lastSum = String(value);
    this.currentOp = '';
    this.mode = App.modes.over;
  }
  
  // Storage placeholder for this.keys. Created during constructor
  keys;
  
  lastSum = '';
  
  // Storage for the string used to calculate sums
  calcString = '';
  
  // Storage var for the current operation
  currentOp = ''; 
  
  // Var for changing calc behavior based on current user input
  // Start with override
  mode = App.modes.over;

  // Static variable used for storing mode constants
  static modes = {
    ins : "MODE.INSERT", // Listen for serial value inputs. If value is 1, allow user to click 3 for 13
    over: "MODE.OVERRIDE", // Allow the current value to be overwritten. Applys to when value is 0 or a sum was just reached.
    neg: "MODE.NEGATIVE" // Expect that the next value input will be negative
  };
  
  // An object for storing buttons, their associated keys, and operations
  buttons = {

  numpad : [
    { name: "one", value: 1, key: "1", operation:"VALUE" },
    { name: "two", value: 2, key: "2", operation:"VALUE" },
    { name: "three", value: 3, key: "3", operation:"VALUE" },
    { name: "four", value: 4, key: "4", operation:"VALUE" },
    { name: "five", value: 5, key: "5", operation:"VALUE" },
    { name: "six", value: 6, key:"6", operation:"VALUE"},
    { name: "seven", value: 7, key:"7", operation:"VALUE" },
    { name: "eight", value: 8, key:"8", operation:"VALUE" },
    { name: "nine", value: 9, key:"9",operation:"VALUE"  },
    { name: "zero", value: 0, key:"0", operation:"VALUE" }
  ],

  operations : [
    { name: "add", value: "+", key:"+", operation: "ADD" },
    { name: "subtract", value: "-", key:"-", operation: "SUBTRACT" },
    { name: "multiply", value: "x", key:"*", operation: "MULTIPLY" },
    { name: "divide", value: "/", key:"/", operation: "DIVIDE" }
  ],

  equals :{ name: "equals", value: "=", key:["=", "Enter"], operation: "CALCULATE" },

  clear: { name: "clear", value: "C", key:["Backspace"], operation: "CLEAR" },
    
  negative: {name: "negative", value: '+/-', operation: "NEGATE"},

  decimal : { name: "decimal", value: ".", key:".", operation: "DECIMAL" }
};

  render() {
    let numpad_buttons = [];
    this.buttons.numpad.forEach((button, idx) => {
      let button_template = (
        <Button
          key={idx}
          data-trigger={button.key}
          onClick={(event) => this.handleKeyPress(event)}
          id={button.name}
          className="numpad-button calculator-button"
          variant="outline-dark"
        >
          {button.value}
        </Button>
      );
      numpad_buttons.push(button_template);
    });

    let decimal_button = (
      <Button
        data-trigger={this.buttons.decimal.key}
        onClick={(event) => this.handleKeyPress(event)}
        id={this.buttons.decimal.name}
        className="numpad-button calculator-button"
        variant="outline-dark"
      >
        {this.buttons.decimal.value}
      </Button>
    );

    let equals_button = (
      <Button
        onClick={(event) => this.handleKeyPress(event)}
        data-trigger={this.buttons.equals.key}
        id={this.buttons.equals.name}
        variant="outline-primary"
        className="calculator-button"
      >
        {this.buttons.equals.value}
      </Button>
    );
    
    let operations_buttons = [];
    this.buttons.operations.forEach((button, idx) => {
      operations_buttons.push(
        <Button 
          key={idx}
          onClick={(event) => this.handleKeyPress(event)}
          data-trigger={button.key}
          id={button.name} 
          className="operations-button calculator-button" 
          variant="outline-dark">
          {button.value}
        </Button>);
    });
    
    let clear_button = 
        <Button 
          onClick={(event) => this.handleKeyPress(event)}
          data-trigger={this.buttons.clear.key}
          className="calculator-button clear-button"        
          id={this.buttons.clear.name} 
          variant="outline-danger">
          {this.buttons.clear.value}
        </Button>;
    
    let toggle_negative = 
        <Button
          onClick={(event) => this.handleKeyPress(event)}
          data-trigger={this.buttons.negative.key}
          className="calculator-button toggle-negative-button"
          id={this.buttons.negative.name}
          variant="outline-dark"
          >
          {this.buttons.negative.value}
        </Button>
        ;

    return (
      <Row id="app-wrapper">
        <Col>
          <Container>
            <Card id="calculator">
              <Card.Body>
                <Row>
                  <div id="display">{this.state.display}</div>
                </Row>
                <Row id="memory">
                  <Col>
                    {toggle_negative}
                    {clear_button}
                  </Col>
                </Row>
                <Row id="buttons">
                  <Col id="numpad">
                      {numpad_buttons}
                      {decimal_button}
                      {equals_button}
                  </Col>
                  <Col id="operations">
                    {operations_buttons}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Container>
        </Col>
      </Row>
    );
  }
}

//Standard App Export
export default App;