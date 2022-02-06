import Stack from 'ts-data.stack/stack';

import {
  BasicBlock,
} from "./basicBlock";

import {
  OPTYPE,
  Instruction,
  Label,
  CC,
  INSTFLAG,
} from './instruction'

export class Code {
  public instructions: Instruction[] = [];                      // Instructions array
  public labels: Label[] = [];                                  // Labels array (symbol table)
  public basicBlocks: BasicBlock[] = [];                        // Basic blocks
  public dataAddr: number = NaN;                                // Data address startpoint marked by .data
  public textAddr: number = NaN;                                // Text address startpoint marked by .text
  public endAddr: number = NaN;                                 // End address marked by .end
  public dataLine: number = NaN;                                // Line number of .data
  public textLine: number = NaN;                                // Line number of .text
  public endLine: number = NaN;                                 // Line number of .end
  private firstInstrIdx: number = NaN;                          // First instruction index after .ORIG
  private lineNum: number = 0;                                  // Keeps track of current line number (in the file)
  private memAddr: number = NaN;                                // Keep track of current memory address
  private stack: Stack<Instruction> = new Stack<Instruction>(); // Stack used for building CFG

  constructor(text: string) {
    // First round
    this.buildInstructions(text);
    this.linkLabels();
  }

  // Returns the label at the specified address
  public findLabelByAddress(address: number): Label {
    let label = new Label(new Instruction(""));
    for (let i = 0; i < this.labels.length; i++) {
      if (this.labels[i].memAddr == address) {
        label = this.labels[i];
      }
    }
    return label;
  }

  // Build all instructions in the code
  private buildInstructions(text: string) {
    let lines = text.split('\n');
    let instruction: Instruction;
    let line: string;
    
    // Construct each instruction
    let endWithSharp: boolean = false;
    let comment_block_flag: boolean = false;
    for (let idx = 0; idx < lines.length; idx++) {
      endWithSharp = false;
      line = lines[idx];
      line = line.trim();
      // remove '/* */'
      if (line.slice(0, 2) == '/*') {
        comment_block_flag = true;
      }
      if (comment_block_flag == true) {
        if (line.slice(line.length-2) == '*/') {
          comment_block_flag = false;
        }
        line = ""
      }
      // remove '#'
      for (let i = 0; i < line.length; i++) {
        if (line[i] == '#') {
          if (i > 0 && !line[i - 1].match(/\s/)) {
            endWithSharp = true;
          }
          line = line.slice(0, i);
          break;
        }
      }
      // Remove '//'
      if (line.slice(0, 2) == '//') {
        line = ""
      }
      if (line) {
        instruction = new Instruction(line);
        // Handle .ascii in multiple line manner
        if (instruction.optype == OPTYPE.directiveString && instruction.mem &&
          instruction.mem.split('"').length < 3) {
          idx = this.parseDirectiveString(instruction, idx, lines);
        }
        this.pushInstruction(instruction);
      }
      this.lineNum++;
    }
  }

  private parseDirectiveString(instruction: Instruction, idx: number, lines: string[]): number {
    let line: string;
    while (++idx < lines.length) {
      this.lineNum++;
      instruction.mem = instruction.mem + '\n';
      line = lines[idx];
      for (let i = 0; i < line.length; i++) {
        if (line[i] == ';') {
          line = line.slice(0, i);
          break;
        }
      }
      instruction.mem = instruction.mem + line;
      for (let i = 0; i < line.length; i++) {
        if (line[i] == '"') {
          return idx;
        }
      }
    }
    return idx;
  }

  // Push an instruction according to its type ({push}/{not push}/{push to label})
  private pushInstruction(instruction: Instruction) {
    let label: Label;
    // Keep track of line numbers
    instruction.line = this.lineNum;

    // Handle .data, .text and .end here
    if (instruction.optype == OPTYPE.directiveData && isNaN(this.dataAddr)) {
      this.memAddr = instruction.memAddr;
      this.dataLine = instruction.line;
      this.dataAddr = this.memAddr;
    } else if (instruction.optype == OPTYPE.directiveText && isNaN(this.textAddr)){  
      this.memAddr = instruction.memAddr;
      this.textLine = instruction.line;
      this.textAddr = this.memAddr;
    } else if (instruction.optype == OPTYPE.directiveEnd && isNaN(this.endAddr)) {
      this.endAddr = this.memAddr;
      this.endLine = instruction.line;
    } else {
      instruction.memAddr = this.memAddr++;
    }

    // Decide what to do according to optype
    switch (instruction.optype) {
      case OPTYPE.directiveData:
      case OPTYPE.directiveText:
      case OPTYPE.directiveEnd:
        break;
      case OPTYPE.directiveNumber:
        this.instructions.push(instruction);
        break;
      case OPTYPE.directiveString:
        if (!isNaN(instruction.mem.length)) {
          instruction.mem.slice(1, instruction.mem.length - 1);
          this.memAddr += instruction.mem.length;
        }
        for (let i = 0; i < instruction.mem.length; i++) {
          // Take out the '\' characters
          if (instruction.mem[i] == '\\') {
            this.memAddr--;
          }
        }
        this.instructions.push(instruction);
        break;

      case OPTYPE.label:
        // Labels do not occupy memory addresses
        this.memAddr--;
        label = new Label(instruction);
        this.labels.push(label);
        break;
        
      default:
        instruction.calcMem();
        this.instructions.push(instruction);
        break;
    }
  }

  // Link labels with the instruction at that memory location
  private linkLabels() {
    for (let instruction_idx = 0; instruction_idx < this.instructions.length; instruction_idx++) {
      // Skip instructions before .data
      if (this.instructions[instruction_idx].memAddr == 0) { continue; }
      for (let label_idx = 0; label_idx < this.labels.length; label_idx++) {
        // Skip labels before .data
        if (this.labels[label_idx].memAddr == 0) { continue; }
        if (this.instructions[instruction_idx].memAddr == this.labels[label_idx].memAddr) {
          this.labels[label_idx].instruction = this.instructions[instruction_idx];
        }
      }
    }
  }
}
