import { exportFile } from '../api/exportService';

function FileExportButton({ endpoint, filename }) {
  return (
    <button onClick={() => exportFile(endpoint, filename)}>
      Export {filename.split('.').pop().toUpperCase()}
    </button>
  );
}

export default FileExportButton;