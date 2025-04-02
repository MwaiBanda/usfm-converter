import './App.css'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from './components/ui/button'
import { useEffect, useState } from 'react'
import { USFMParser, Filter, Validator } from 'usfm-grammar-web';
import { Skeleton } from './components/ui/skeleton';

type Processed = {
  original: string,
  usx: string,
  filename: string
}

async function getFileMedata(file: File) {
  let text = await file.text()
  return { name: file.name, text: text }
} 

function App() {
  const [files, setFiles] = useState<File[]>([])
  const [processedFiles, setProcessedFiles] = useState<Processed[]>([])
  
  useEffect(() => {
    const initParser = async () => {
      await USFMParser.init("https://cdn.jsdelivr.net/npm/usfm-grammar-web@3.0.0/tree-sitter-usfm.wasm",
        "https://cdn.jsdelivr.net/npm/usfm-grammar-web@3.0.0/tree-sitter.wasm");
      await Validator.init("https://cdn.jsdelivr.net/npm/usfm-grammar-web@3.0.0/tree-sitter-usfm.wasm",
              "https://cdn.jsdelivr.net/npm/usfm-grammar-web@3.0.0/tree-sitter.wasm");

    };
    initParser();
  }, []);

  async function processFile(file: {name: string, text: string}) {
    const usfmParser = new USFMParser(file.text);
    const usxElem = usfmParser.toUSX() 
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(usxElem as unknown as string, "application/xml");
    const USX = new XMLSerializer().serializeToString(xmlDoc);
    console.log(USX)
    setProcessedFiles([...processedFiles, ...[{
      original: file.name,
      usx: USX,
      filename: file.name.replace("usfm", "usx")
    }]])  
  }

  useEffect(() => {
    if (files.length > 0) {
           
      Promise.all(files.map(f => getFileMedata(f))).then(files => {
        console.log(files)
        Promise.all(files.filter(f => !processedFiles.find(p => p.original == f.name)).map(file  => {
          processFile(file)
        })).then(() => {
          console.log("processing")
        })
      })
    }
  }, [files])
  return (
    <div>
      <Card>
        <CardHeader className='flex flex-col'>
          <CardTitle>Convert USFM to USX</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='min-w-[500px] flex flex-col justify-center items-center'>
            <label htmlFor="files" className='min-w-[400px] max-w-[400px] bg-sky-100 rounded-sm border-2 border-sky-600 border-dashed'>
              <span className='min-h-[300px] flex flex-col items-center justify-center'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
                <span className='mt-2'>Click or drag your files here to convert</span>
              </span>
            </label>
            <input 
              id='files' 
              type='file' 
              name='files' 
              style={{display: "none"}}
              multiple
              onChange={e => {
                const fileList = e.target.files
                if (fileList) setFiles(Array.from(fileList).filter(e => e.name.includes(".usfm")))
                console.log(e.target.files)
              }}
            ></input>
            <div className='min-w-[500px] flex flex-col justify-center items-start mt-5'>
              <FileList files={files} processed={processedFiles}/>
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex flex-row w-full justify-between'>
        <p className='text-gray-500'>{files && `Total ${files.length} files`}</p>
        <Button>
          <span className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className='ml-2'>Download All</span>
          </span>
        </Button>
        </CardFooter>
      </Card>
    </ div>
  )
}

function FileList({ files, processed }: {files: File[] , processed: Processed[]}) {
  return files.map((file, i) => <div key={`file.usfm.${i}`} className='border-b border-gray-200 w-full flex justify-between' >
    <span className='my-2 flex items-center justify-between'><span>{file.name}</span><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5 mr-2 ml-2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg><ProcessedElement elm={processed?.find(e => e.original == file.name)}/></span>
    </div>)
}

function ProcessedElement({ elm}: {elm: Processed | undefined}) {
  return <a 
    className='underline text-sky-600' 
    href={URL.createObjectURL(new Blob([elm?.usx ?? ""], {type: "text/xml"}))}
    download={elm?.filename}
  >{elm ? elm.filename : <Skeleton className="w-[200px] h-[20px] rounded-2" />}</a>
}

export default App
