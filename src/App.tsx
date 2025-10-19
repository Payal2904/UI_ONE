import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Download, Loader2 } from 'lucide-react';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { extractFieldsFromFigma } from './services/figmaService';
import { parseFile, extractDBMappings, extractComputedFields } from './services/fileParserService';
import { consolidateData, exportToExcel } from './services/dataProcessingService';
import type { ConsolidatedField, ValidationError } from './types/index.js';

function App() {
  // Figma inputs
  const [figmaFileKey, setFigmaFileKey] = useState('');
  const [figmaNodeId, setFigmaNodeId] = useState('');
  const [figmaApiToken, setFigmaApiToken] = useState('');
  
  // File uploads
  const [dbMappingFile, setDbMappingFile] = useState<File | null>(null);
  const [computedFieldsFile, setComputedFieldsFile] = useState<File | null>(null);
  
  // Plan type
  const [planType, setPlanType] = useState('');
  
  // Processing state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Results
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedField[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleProcess = async () => {
    setLoading(true);
    setError(null);
    setValidationErrors([]);

    try {
      // Validate inputs
      if (!figmaFileKey || !figmaNodeId || !figmaApiToken) {
        throw new Error('Please provide Figma file key, node ID, and API token');
      }
      if (!dbMappingFile) {
        throw new Error('Please upload DB mapping file');
      }
      if (!computedFieldsFile) {
        throw new Error('Please upload computed fields file');
      }
      if (!planType) {
        throw new Error('Please enter plan type');
      }

      // Step 1: Extract fields from Figma
      console.log('Extracting fields from Figma...');
      const figmaFields = await extractFieldsFromFigma({
        fileKey: figmaFileKey,
        nodeId: figmaNodeId,
        apiToken: figmaApiToken,
      });
      console.log(`Extracted ${figmaFields.length} fields from Figma`);

      // Step 2: Parse DB mapping file
      console.log('Parsing DB mapping file...');
      const dbMappingData = await parseFile(dbMappingFile);
      const dbMappings = extractDBMappings(dbMappingData);
      console.log(`Extracted ${dbMappings.length} DB mappings`);

      // Step 3: Parse computed fields file
      console.log('Parsing computed fields file...');
      const computedFieldsData = await parseFile(computedFieldsFile);
      const computedFields = extractComputedFields(computedFieldsData);
      console.log(`Extracted ${computedFields.length} computed fields`);

      // Step 4: Consolidate data
      console.log('Consolidating data...');
      const { consolidated, errors } = consolidateData(
        figmaFields,
        dbMappings,
        computedFields,
        planType
      );

      setConsolidatedData(consolidated);
      setValidationErrors(errors);
      console.log('Processing complete!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error processing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (consolidatedData.length === 0) {
      alert('No data to export');
      return;
    }
    exportToExcel(consolidatedData);
  };

  const handleReset = () => {
    setFigmaFileKey('');
    setFigmaNodeId('');
    setFigmaApiToken('');
    setDbMappingFile(null);
    setComputedFieldsFile(null);
    setPlanType('');
    setConsolidatedData([]);
    setValidationErrors([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center py-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FileSpreadsheet className="w-10 h-10 text-indigo-600" />
            <h1 className="text-4xl font-bold text-gray-900">Excel Consolidator</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Generate consolidated field Excel from Figma, DB mappings, and computed fields
          </p>
        </header>

        <div className="grid gap-6">
          {/* Input Section */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Inputs</CardTitle>
              <CardDescription>
                Provide Figma details, upload mapping files, and specify plan type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="figma" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="figma">Figma Details</TabsTrigger>
                  <TabsTrigger value="files">Upload Files</TabsTrigger>
                  <TabsTrigger value="plan">Plan Type</TabsTrigger>
                </TabsList>

                <TabsContent value="figma" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fileKey">Figma File Key</Label>
                    <Input
                      id="fileKey"
                      placeholder="e.g., abc123def456"
                      value={figmaFileKey}
                      onChange={(e) => setFigmaFileKey(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Found in the Figma URL: figma.com/file/[FILE_KEY]/...
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nodeId">Node ID</Label>
                    <Input
                      id="nodeId"
                      placeholder="e.g., 123:456"
                      value={figmaNodeId}
                      onChange={(e) => setFigmaNodeId(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Right-click the frame in Figma → "Copy/Paste as" → "Copy link" → Extract node ID
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apiToken">Figma API Token</Label>
                    <Input
                      id="apiToken"
                      type="password"
                      placeholder="Your Figma personal access token"
                      value={figmaApiToken}
                      onChange={(e) => setFigmaApiToken(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Get from: Figma → Settings → Account → Personal access tokens
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="files" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dbMapping">DB Mapping File</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="dbMapping"
                        type="file"
                        accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                        onChange={(e) => setDbMappingFile(e.target.files?.[0] || null)}
                      />
                      {dbMappingFile && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <Upload className="w-4 h-4" />
                          {dbMappingFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Should contain: field_name, db_column
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="computedFields">Computed/Derived Fields File</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="computedFields"
                        type="file"
                        accept=".xlsx,.xls,.csv,.pdf,.doc,.docx"
                        onChange={(e) => setComputedFieldsFile(e.target.files?.[0] || null)}
                      />
                      {computedFieldsFile && (
                        <span className="text-sm text-green-600 flex items-center gap-1">
                          <Upload className="w-4 h-4" />
                          {computedFieldsFile.name}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Should contain: field_name, formula
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="plan" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="planType">Plan Type</Label>
                    <Input
                      id="planType"
                      placeholder="e.g., Medical, Dental, Vision"
                      value={planType}
                      onChange={(e) => setPlanType(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Specify the plan type (Medical, Dental, Vision, etc.)
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handleProcess} 
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Generate Consolidated Excel
                    </>
                  )}
                </Button>
                <Button 
                  onClick={handleReset} 
                  variant="outline"
                  disabled={loading}
                >
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Validation Issues ({validationErrors.length})</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {validationErrors.slice(0, 10).map((err, idx) => (
                    <li key={idx} className="text-sm">
                      {err.message}
                    </li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li className="text-sm font-semibold">
                      ... and {validationErrors.length - 10} more issues
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Results Table */}
          {consolidatedData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Consolidated Data Preview</CardTitle>
                    <CardDescription>
                      {consolidatedData.length} fields processed
                    </CardDescription>
                  </div>
                  <Button onClick={handleExport} className="gap-2">
                    <Download className="w-4 h-4" />
                    Export to Excel
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Section</th>
                        <th className="px-4 py-2 text-left">Subsection</th>
                        <th className="px-4 py-2 text-left">Field Name</th>
                        <th className="px-4 py-2 text-center">Order</th>
                        <th className="px-4 py-2 text-left">Screen</th>
                        <th className="px-4 py-2 text-left">DB Mapping</th>
                        <th className="px-4 py-2 text-center">Computed</th>
                        <th className="px-4 py-2 text-left">Formula</th>
                        <th className="px-4 py-2 text-left">Plan Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consolidatedData.map((row, idx) => (
                        <tr 
                          key={idx} 
                          className={`border-b hover:bg-gray-50 ${
                            !row.db_mapping ? 'bg-red-50' : 
                            row.is_computed === 'YES' && !row.formula ? 'bg-yellow-50' : ''
                          }`}
                        >
                          <td className="px-4 py-2">{row.section}</td>
                          <td className="px-4 py-2">{row.subsection}</td>
                          <td className="px-4 py-2 font-medium">{row.field_name}</td>
                          <td className="px-4 py-2 text-center">{row.order}</td>
                          <td className="px-4 py-2">
                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                              {row.screen_name}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {row.db_mapping || (
                              <span className="text-red-600 text-xs">Missing</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 rounded text-xs ${
                              row.is_computed === 'YES' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {row.is_computed}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs max-w-xs truncate">
                            {row.formula || '-'}
                          </td>
                          <td className="px-4 py-2">{row.plan_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <footer className="text-center py-8 text-gray-600 text-sm">
          <p>Excel Consolidator UI • Step 1 of 2-step automation process</p>
          <p className="mt-1">Next: Feed generated Excel into Config Builder UI</p>
        </footer>
      </div>
    </div>
  );
}

export default App;