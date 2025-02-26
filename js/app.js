/**
 * app.js - UI interaction for the Katapult to SPIDAcal transformer
 */

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const fileList = document.getElementById('fileList');
    const fileListContainer = document.getElementById('fileListContainer');
    const processButton = document.getElementById('processButton');
    const clearButton = document.getElementById('clearButton');
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsContent = document.getElementById('settingsContent');
    const logOutput = document.getElementById('logOutput');
    const resultsContainer = document.getElementById('resultsContainer');
    const tabs = document.querySelectorAll('.tab');
    
    // Files storage
    let files = [];
    
    // Formatting helpers
    function formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
    function getTimestamp() {
      const now = new Date();
      return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}]`;
    }
    
    function addLogEntry(message, type = 'info') {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      
      const timestamp = document.createElement('span');
      timestamp.className = 'log-timestamp';
      timestamp.textContent = getTimestamp();
      
      const logMessage = document.createElement('span');
      logMessage.className = `log-${type}`;
      logMessage.textContent = message;
      
      logEntry.appendChild(timestamp);
      logEntry.appendChild(logMessage);
      
      logOutput.appendChild(logEntry);
      logOutput.scrollTop = logOutput.scrollHeight;
    }
    
    // Event: File Drop
    dropZone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropZone.classList.add('active');
    });
    
    dropZone.addEventListener('dragleave', function() {
      dropZone.classList.remove('active');
    });
    
    dropZone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropZone.classList.remove('active');
      
      const droppedFiles = e.dataTransfer.files;
      handleFiles(droppedFiles);
    });
    
    // Event: File Input
    dropZone.addEventListener('click', function() {
      fileInput.click();
    });
    
    fileInput.addEventListener('change', function() {
      handleFiles(fileInput.files);
    });
    
    // Process files
    function handleFiles(newFiles) {
      if (newFiles.length === 0) return;
      
      for (let i = 0; i < newFiles.length; i++) {
        const file = newFiles[i];
        
        // Only accept JSON files
        if (!file.name.toLowerCase().endsWith('.json')) {
          addLogEntry(`Skipped non-JSON file: ${file.name}`, 'warning');
          continue;
        }
        
        // Check if file already exists in the list
        if (files.some(f => f.name === file.name)) {
          addLogEntry(`File already added: ${file.name}`, 'warning');
          continue;
        }
        
        files.push(file);
        addLogEntry(`Added file: ${file.name}`, 'info');
      }
      
      updateFileList();
    }
    
    function updateFileList() {
      if (files.length === 0) {
        fileListContainer.style.display = 'none';
        return;
      }
      
      fileListContainer.style.display = 'block';
      fileList.innerHTML = '';
      
      files.forEach((file, index) => {
        const listItem = document.createElement('li');
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = file.name;
        
        const fileSize = document.createElement('div');
        fileSize.className = 'file-size';
        fileSize.textContent = formatBytes(file.size);
        
        const fileStatus = document.createElement('div');
        fileStatus.className = 'file-status status-pending';
        fileStatus.textContent = 'Pending';
        
        const removeButton = document.createElement('button');
        removeButton.className = 'button button-secondary';
        removeButton.textContent = 'Remove';
        removeButton.style.marginLeft = '10px';
        removeButton.addEventListener('click', () => {
          files.splice(index, 1);
          updateFileList();
          addLogEntry(`Removed file: ${file.name}`, 'info');
        });
        
        listItem.appendChild(fileName);
        listItem.appendChild(fileSize);
        listItem.appendChild(fileStatus);
        listItem.appendChild(removeButton);
        
        fileList.appendChild(listItem);
      });
    }
    
    // Event: Process Button
    processButton.addEventListener('click', function() {
      if (files.length === 0) {
        addLogEntry('No files to process', 'warning');
        return;
      }
      
      addLogEntry(`Processing ${files.length} files...`, 'info');
      
      // Get default values from form
      const defaultValues = {
        wire: {
          primary: {
            size: document.getElementById('primaryWireSize').value,
            conductorProperties: {
              diameter: parseFloat(document.getElementById('primaryWireDiameter').value),
              weight: parseFloat(document.getElementById('primaryWireWeight').value)
            }
          },
          neutral: {
            size: document.getElementById('neutralWireSize').value,
            conductorProperties: {
              diameter: parseFloat(document.getElementById('neutralWireDiameter').value),
              weight: parseFloat(document.getElementById('neutralWireWeight').value)
            }
          },
          secondaryOpen: {
            size: document.getElementById('secondaryOpenWireSize').value,
            conductorProperties: {
              diameter: parseFloat(document.getElementById('secondaryOpenWireDiameter').value),
              weight: parseFloat(document.getElementById('secondaryOpenWireWeight').value)
            }
          }
        }
      };
      
      // Process each file
      const results = [];
      let processedCount = 0;
      
      files.forEach((file, index) => {
        const statusElements = document.querySelectorAll('.file-status');
        statusElements[index].className = 'file-status status-processing';
        statusElements[index].textContent = 'Processing';
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
          try {
            // Get the raw file content
            const rawContent = e.target.result;
            
            // Now transform the content - the transformer will handle parsing/fixing
            const { transformedJson, changes } = transformJson(rawContent, defaultValues);
            
            // Create a download link
            const downloadUrl = URL.createObjectURL(
              new Blob([JSON.stringify(transformedJson, null, 2)], { type: 'application/json' })
            );
            
            results.push({
              name: file.name,
              changes: changes,
              transformedJson: transformedJson,
              url: downloadUrl,
              success: true
            });
            
            // Update UI
            statusElements[index].className = 'file-status status-completed';
            statusElements[index].textContent = 'Completed';
            
            // Log changes
            addLogEntry(`Processed ${file.name}: ${changes.length} changes made`, 'success');
            changes.forEach(change => {
              addLogEntry(`  - ${change}`, 'info');
            });
          } catch (error) {
            console.error(error);
            
            // Update UI
            statusElements[index].className = 'file-status status-error';
            statusElements[index].textContent = 'Error';
            
            results.push({
              name: file.name,
              error: error.message,
              success: false
            });
            
            // Log error
            addLogEntry(`Error processing ${file.name}: ${error.message}`, 'error');
          }
          
          // Check if all files are processed
          processedCount++;
          if (processedCount === files.length) {
            updateResults(results);
          }
        };
        
        reader.readAsText(file);
      });
    });
    
    // Update results display
    function updateResults(results) {
      resultsContainer.innerHTML = '';
      
      if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No files processed.</p>';
        return;
      }
      
      const summary = document.createElement('div');
      summary.className = 'alert alert-success';
      summary.innerHTML = `<p>Processed ${results.length} file(s). ${results.filter(r => r.success).length} successful, ${results.filter(r => !r.success).length} with errors.</p>`;
      resultsContainer.appendChild(summary);
      
      // Create table of results
      const table = document.createElement('table');
      table.className = 'file-list';
      table.style.width = '100%';
      
      const tableHeader = document.createElement('tr');
      tableHeader.innerHTML = `
        <th style="text-align: left; padding: 8px;">File Name</th>
        <th style="text-align: center; padding: 8px;">Status</th>
        <th style="text-align: center; padding: 8px;">Changes</th>
        <th style="text-align: center; padding: 8px;">Actions</th>
      `;
      
      const tableBody = document.createElement('tbody');
      tableBody.appendChild(tableHeader);
      
      results.forEach(result => {
        const row = document.createElement('tr');
        
        // File name cell
        const nameCell = document.createElement('td');
        nameCell.style.padding = '8px';
        nameCell.textContent = result.name;
        
        // Status cell
        const statusCell = document.createElement('td');
        statusCell.style.padding = '8px';
        statusCell.style.textAlign = 'center';
        
        const statusBadge = document.createElement('span');
        statusBadge.className = `file-status ${result.success ? 'status-completed' : 'status-error'}`;
        statusBadge.textContent = result.success ? 'Success' : 'Error';
        statusCell.appendChild(statusBadge);
        
        // Changes cell
        const changesCell = document.createElement('td');
        changesCell.style.padding = '8px';
        changesCell.style.textAlign = 'center';
        
        if (result.success) {
          changesCell.textContent = result.changes.length;
        } else {
          changesCell.textContent = '-';
        }
        
        // Actions cell
        const actionsCell = document.createElement('td');
        actionsCell.style.padding = '8px';
        actionsCell.style.textAlign = 'center';
        
        if (result.success) {
          const downloadButton = document.createElement('a');
          downloadButton.href = result.url;
          downloadButton.className = 'button button-success';
          downloadButton.style.marginRight = '5px';
          downloadButton.textContent = 'Download';
          downloadButton.download = `transformed_${result.name}`;
          
          const viewChangesButton = document.createElement('button');
          viewChangesButton.className = 'button button-secondary';
          viewChangesButton.textContent = 'View Changes';
          viewChangesButton.addEventListener('click', () => {
            showChanges(result);
          });
          
          actionsCell.appendChild(downloadButton);
          actionsCell.appendChild(viewChangesButton);
        } else {
          const errorButton = document.createElement('button');
          errorButton.className = 'button button-warning';
          errorButton.textContent = 'Show Error';
          errorButton.addEventListener('click', () => {
            alert(`Error processing ${result.name}: ${result.error}`);
          });
          
          actionsCell.appendChild(errorButton);
        }
        
        // Add cells to row
        row.appendChild(nameCell);
        row.appendChild(statusCell);
        row.appendChild(changesCell);
        row.appendChild(actionsCell);
        
        // Add row to table
        tableBody.appendChild(row);
      });
      
      table.appendChild(tableBody);
      resultsContainer.appendChild(table);
    }
    
    // Show changes in a modal
    function showChanges(result) {
      // Create modal container
      const modal = document.createElement('div');
      modal.className = 'modal';
      
      // Create modal content
      const modalContent = document.createElement('div');
      modalContent.className = 'modal-content';
      
      // Create modal header
      const modalHeader = document.createElement('div');
      modalHeader.className = 'modal-header';
      
      const modalTitle = document.createElement('h3');
      modalTitle.textContent = `Changes for ${result.name}`;
      
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '&times;';
      closeButton.className = 'modal-close';
      closeButton.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(closeButton);
      
      // Create modal body
      const modalBody = document.createElement('div');
      
      if (result.changes.length === 0) {
        modalBody.innerHTML = '<p>No changes were made to this file.</p>';
      } else {
        const changesList = document.createElement('ul');
        changesList.style.paddingLeft = '20px';
        
        result.changes.forEach(change => {
          const listItem = document.createElement('li');
          listItem.textContent = change;
          listItem.style.marginBottom = '5px';
          changesList.appendChild(listItem);
        });
        
        modalBody.appendChild(changesList);
      }
      
      // Assemble modal
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      modal.appendChild(modalContent);
      
      // Add modal to body
      document.body.appendChild(modal);
      
      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
        }
      });
    }
    
    // Event: Clear Button
    clearButton.addEventListener('click', function() {
      files = [];
      updateFileList();
      addLogEntry('Cleared all files', 'info');
      
      // Reset results
      resultsContainer.innerHTML = '<p>No files processed yet. Upload and process files to see results here.</p>';
    });
    
    // Event: Settings Toggle
    settingsToggle.addEventListener('click', function() {
      settingsContent.classList.toggle('active');
    });
    
    // Event: Tab Switching
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabName = tab.getAttribute('data-tab');
        
        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
      });
    });
    
    // Add application version info - updated for three-layer design
    const appVersion = "1.1.0";
    addLogEntry(`Katapult to SPIDAcal Transformer v${appVersion} loaded`, 'info');
    addLogEntry('Ready to transform JSON files from v9 to v10 schema with three design layers', 'info');
    addLogEntry('Design layers: Existing, Proposed (comm changes only), and Remedy (all changes)', 'info');
  });