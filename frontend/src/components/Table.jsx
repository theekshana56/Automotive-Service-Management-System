function Table({ headers, data, renderRow }) {
    return (
      <table>
        <thead>
          <tr>
            {headers.map(h => <th key={h.key}>{h.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.map(item => renderRow(item))}
        </tbody>
      </table>
    );
  }
  
  export default Table;