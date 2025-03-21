"use client"

import { useEffect, useRef, useState } from "react";
import useAppContext from "../context/appContext";
import axios from "axios";
import { careerPlanService, interviewService } from "../services";
import { FaFileUpload } from "react-icons/fa";
import { IoDocumentTextSharp } from "react-icons/io5";
import Loading from "./loading";

export const UploadResume = () => {
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState({ type: "default", description: "" });
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    setModuleActive,
    setProfile,
    isUploaded, setIsUploaded,
    fileUpload, setFileUpload,
    setCareerPlan,
    setInterview,
    setLoadingProfile,
    setLoadingCareerPlan,
    setLoadingInterview,
    setChatMessages,
  } = useAppContext();

  useEffect(() => {
    if (fileUpload && !isUploaded) {
      uploadFile(); // Call uploadFile only after fileUpload has been set

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUpload]);

  const handleDivClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleChangeFile = (e: any) => {
    setIsUploaded(false);

    if (e.target.files[0]) {
      const extension = e.target.files[0].name.slice(e.target.files[0].name.lastIndexOf("."));
      const validExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
      if (!validExtensions.includes(extension)) {
        setMessage({ ...message, type: "error", description: "Invalid file format! Please select a PDF, PNG, JPG or JPEG file." });
        setIsError(false);
        return
      } else {
        setIsError(true)
        setFileUpload(e.target.files[0])
      }
    }
  }

  async function uploadFile() {
    setIsLoading(true);
    setLoadingProfile(true)
    setLoadingCareerPlan(true)
    setLoadingInterview(true)
    setProfile({})
    setInterview(null)
    setCareerPlan(null)

    if (!fileUpload) {
      setMessage({ ...message, type: "error", description: "No file to upload." });
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", fileUpload);

    try {
      const response = await axios.post("/api/upload-resume", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      const result = await response.data;

      if (result.status === "fail") {
        setMessage({ ...message, type: "error", description: "An error occurred while create career plan." });
      } else {
        setMessage({ ...message, type: "success", description: "Resume uploaded successfully." });
        setIsUploaded(true);
        setProfile(JSON.parse(result.data));
        setLoadingProfile(false)
        setChatMessages((prev: any) => [...prev, { role: "assistant", content: "I have received your resume. How can I help you?" }]);

        // Get career plan
        const dataCareerPlan: any = await careerPlanService(result.data);

        if (dataCareerPlan.status === "fail") {
          setMessage({ ...message, type: "error", description: "An error occurred while creating career plan." });
        } else if (dataCareerPlan.data) {
          setCareerPlan(dataCareerPlan.data.data);
        }
        setLoadingCareerPlan(false)

        // Get interview questionnaire
        const dataInterview = await interviewService(result.data);

        if (dataInterview.status === "fail") {
          setMessage({ ...message, type: "error", description: "An error occurred while create interview questions." });
        } else {
          setInterview(dataInterview.data.data);
        }
        setLoadingInterview(false)
      }
    } catch (error) {
      console.log(error);
      setMessage({ ...message, type: "error", description: "An error occurred while uploading the file." });
    }

    setIsLoading(false);
  }

  const handleMessage = () => {
    let rawHTML = "";

    if (!isError && message.description.length > 0) {
      rawHTML = `<span>${message.description}</span>`;
      return <div className="p-2 mt-4 text-sm text-red-500 text-center rounded" dangerouslySetInnerHTML={{ __html: rawHTML }} />;
    }
  }

  const renderMessageUpload = () => {
    return (
      <div className="bg-blue-500 w-64 hover:bg-blue-700 text-white text-center pt-2 pb-1 rounded-full lg:w-80">
        {isLoading ? <Loading value="Please wait..." /> : "Upload file"}
      </div>
    )
  }

  if (!isUploaded) {
    return (
      <>
        <div className="flex flex-col flex-shrink-0 rounded-2xl h-36 p-4 bg-blue-50 lg:h-60">
          <div className="p-0 w-100 flex justify-center">
            <div className="p-0 flex flex-col justify-center items-center">

              <div
                className="bg-cyan-600 w-24 h-24 p-2 hover:bg-cyan-700 text-white rounded-full flex flex-col justify-center items-center cursor-pointer lg:w-24 lg:h-24"
                onClick={handleDivClick}
              >
                <FaFileUpload size={32} className="mb-4" />
                <label className="text-xs text-center hover:cursor-pointer">
                  {fileUpload != undefined ? "Change file" : "Upload resume"}
                </label>
              </div>

              <div className="text-xs mt-2">
                Format PDF, PNG, JPG and JPEG
              </div>

              {handleMessage()}

              {isUploaded &&
                <div
                  className="w-auto py-0 px-4 mt-8  bg-blue-500 text-white text-center rounded hover:cursor-pointer"
                  onClick={() => setModuleActive(2)}
                >
                  Show Profile
                </div>
              }

              <input
                type="file"
                className="invisible"
                ref={fileInputRef}
                name="file"
                onChange={(e) => handleChangeFile(e)}
              />

              {(isError && !isUploaded) && renderMessageUpload()}

            </div>
          </div>
        </div>
      </>
    )
  } else {
    return (
      <div className="flex flex-col flex-shrink-0 rounded-2xl h-auto p-0 lg:p-4 bg-blue-50">
        <div className="p-0 w-100 flex justify-start">
          <div className="p-0 flex justify-start items-center">
            <div className="flex justify-between items-center mr-6 lg:mr-12 lg:justify-center">
              <IoDocumentTextSharp size={25} color={"#E74C3C"} className="mr-2" />
              <span className="text-xs">{fileUpload != undefined ? fileUpload.name : "No file selected"}</span>
            </div>
            <div
              className="w-24 py-1 px-4 mx-2 bg-blue-500 text-xs text-white text-center rounded hover:cursor-pointer"
              onClick={handleDivClick}
            >
              Change file
            </div>

            <input
              type="file"
              className="invisible"
              ref={fileInputRef}
              name="file"
              onChange={(e) => handleChangeFile(e)}
            />

            {(isError && !isUploaded) && renderMessageUpload()}
          </div>
        </div>
      </div>
    )
  }
}
