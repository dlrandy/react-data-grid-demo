import React, { useReducer, useState } from "react";
import ReactDOM, { findDOMNode } from "react-dom";
import ReactDataGrid from "react-data-grid";
import { range } from "lodash";
import { Menu } from "react-data-grid-addons";

import createRowData, { createFakeRow } from "./createRowData";

import "./styles.css";

class RecordsTable extends React.Component {
  constructor(props) {
    super(props);
    this.canvas = null;
    this.copyRef = React.createRef();
    this.scrollListener = () => {
      if (
        this.canvas.scrollHeight -
          (this.canvas.scrollTop + this.canvas.clientHeight) <
        500
      ) {
        this.props.loadNextPage();
      }
    };
  }

  canvas = null;
  state = {
    copyData: {}
  };

  componentDidMount() {
    this.canvas = findDOMNode(this).querySelector(".react-grid-Canvas");
    this.canvas.addEventListener("scroll", this.scrollListener);
    // document.addEventListener("copy", this.handleCopy);
  }

  componentWillUnmount() {
    if (this.canvas) {
      this.canvas.removeEventListener("scroll", this.scrollListener);
    }
    document.removeEventListener("copy", this.handleCopy);
  }

  parseCopyData = (copyData) => {
    console.log(copyData, "-------");
    const { topLeft, bottomRight } = copyData;
    if (!topLeft || !bottomRight) {
      return;
    }
    // Loop through each row
    const text = range(topLeft.rowIdx, bottomRight.rowIdx + 1)
      .map(
        // Loop through each column 这里有和没有选择框索引是不一样的
        (rowIdx) =>
          columns
            .slice(topLeft.idx - 1, bottomRight.idx)
            .map(
              // Grab the row values and make a text string
              (col) => this.rowGetter(rowIdx)[col.key]
            )
            .join("\t")
      )
      .join("\n");
    return text;
  };

  executeCopy = (copyData) => {
    const text = this.parseCopyData(copyData);
    console.log(text);
    this.copyRef.current.value = text;
    this.copyRef.current.select();
    document.execCommand("copy");
  };

  handleCopy = (e) => {
    console.debug("handleCopy Called");
    e.preventDefault();
    const text = this.parseCopyData(this.state.copyData);
    console.debug("text", text);
    e.clipboardData.setData("text/plain", text);
  };

  rowGetter = (i) => this.props.records[i];

  render() {
    return (
      <div>
        <textarea ref={this.copyRef} style={{ width: 0, height: 0, opacity:0 }} />
        <ReactDataGrid
          ref={"grid"}
          minHeight={this.props.minHeight}
          rowHeight={30}
          headerRowHeight={40}
          enableCellSelect={true}
          cellRangeSelection={{
            // onStart: (args) => console.log('start',args),
            // onUpdate: (args) => console.log('update',args),
            onComplete: (args) => {
              console.log("complete", args);
              this.setState((state) => ({
                copyData: args
              }));
              this.executeCopy(args);
            }
          }}
          columns={this.props.columns}
          rowGetter={this.rowGetter}
          rowsCount={this.props.records.length}
          rowSelection={{
            showCheckbox: true,
            enableShiftSelect: true,
            onRowsSelected: (rows) => {
              const ids = rows.map(({ row }) => row.id);
              const records = this.props.records.filter(
                (r) => ids.indexOf(r.id) > -1
              );
              this.props.selectRecords(records);
            },
            onRowsDeselected: (rows) => {
              const ids = rows.map(({ row }) => row.id);
              const records = this.props.records.filter(
                (r) => ids.indexOf(r.id) > -1
              );
              this.props.deselectRecords(records);
            },
            selectBy: {
              // indexes: this.props.selectedRecords.map((r) =>
              //   this.props.records.indexOf(r)
              // )
            }
          }}
        />
      </div>
    );
  }
}

const defaultColumnProperties = {
  // sortable: true,
  width: 120,
  resizable: true
};

const columns = [
  {
    key: "id",
    name: "ID",
    sortDescendingFirst: true
  },
  {
    key: "title",
    name: "Title"
  },
  {
    key: "firstName",
    name: "First Name"
  },
  {
    key: "lastName",
    name: "Last Name"
  },
  {
    key: "email",
    name: "Email"
  },
  {
    key: "street",
    name: "Street"
  },
  {
    key: "zipCode",
    name: "ZipCode"
  },
  {
    key: "date",
    name: "Date"
  },
  {
    key: "jobTitle",
    name: "Job Title"
  },
  {
    key: "catchPhrase",
    name: "Catch Phrase"
  },
  {
    key: "jobArea",
    name: "Job Area"
  },
  {
    key: "jobType",
    name: "Job Type"
  }
].map((c) => ({ ...c, ...defaultColumnProperties }));

const ROW_COUNT = 50;

function Example({ rows, loadNextPage }) {
  const [state, dispatch] = React.useReducer(
    (state, action) => state.concat(action),
    rows
  );
  return (
    <div>
      <RecordsTable
        columns={columns}
        rowGetter={(i) => rows[i]}
        rowsCount={ROW_COUNT}
        minHeight={500}
        records={state}
        loadNextPage={() => dispatch(loadNextPage())}
        cellRangeSelection={{
          onStart: (args) => console.log(rows),
          onUpdate: (args) => console.log(rows),
          onComplete: (args) => console.log(rows)
        }}
      />
    </div>
  );
}

let pages = 1;
const rootElement = document.getElementById("root");
ReactDOM.render(
  <Example
    rows={createRowData(50 * pages)}
    loadNextPage={() => createRowData(50 * ++pages)}
  />,
  rootElement
);
