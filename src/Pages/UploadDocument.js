import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import back from '../assets/svgs/back.svg'
import close from '../assets/svgs/close.svg'
import uploadedFile from '../assets/svgs/uploadedFile.svg'
import { useFormik } from 'formik'
// import * as Yup from 'yup'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-toastify'
import ClipLoader from 'react-spinners/ClipLoader'
import { API_BASE } from '../middleware/API_BASE'
import Audit from '../components/Audit/Audit'
const UploadDocument = () => {
  const navigate = useNavigate()
  const goBack = () => {
    navigate(-1)
  }

  const { create_by, email } = useSelector((state) => state.user.user)

  const ownerInputRef = useRef(null)
  const unitInputRef = useRef(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [dept, setDept] = useState([])
  const [unit, setUnit] = useState([])
  const [documentType, setDocumentType] = useState([])
  const [fetchingData, setFetchingData] = useState(false)
  const [existingOwners, setExistingOwners] = useState(new Set())
  // const [existingUnits, setExistingUnits] = useState(new Set())
  const [suggestedOwners, setSuggestedOwners] = useState([])
  // const [suggestedUnits, setSuggestedUnits] = useState([])
  const [selectedUnitName, setSelectedUnitName] = useState('')
  // const [selectedUnitId, setSelectedUnitId] = useState('')
  const [isOwnerDropdownOpen, setIsOwnerDropdownOpen] = useState(false)

  const config = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'x-api-key': 987654,
    },
  }

  useEffect(() => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-api-key': 987654,
      },
    }
    axios
      .get(API_BASE + 'department', config)
      .then((res) => {
        setDept(res.data.result)
      })
      .catch((err) => console.log(err))

    axios
      .get(API_BASE + 'document', config)
      .then((res) => {
        setDocumentType(res.data.result)
      })
      .catch((err) => console.log(err))

    axios
      .get(API_BASE + 'docu_ment_details', config)
      .then((res) => {
        // Assuming the response contains an array of document objects
        res.data.result.forEach((item) => {
          setExistingOwners((prevOwners) => prevOwners.add(item.document_owner))
        })
      })
      .catch((err) => console.log(err))
  }, [])

  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) {
      // No files selected or files not supported by the browser
      return
    }

    const newFile = e.target.files[0]
    setSelectedFile(newFile)
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
  }

  const createUnit = async () => {
    try {
      const response = await axios.post(
        API_BASE + 'create_unit',
        {
          department_id: UploadValue.values.department_id,
          unit: selectedUnitName, // Use the selected unit name for creating
          description: selectedUnitName,
        },
        config
      )

      if (response.status === 200) {
        // Update the form field with the new unit_id received from the API
        UploadValue.setFieldValue('unit_id', response.data.unit_id)

        // Call the function to get unit_id for the selected unit here
        getUnitIdForSelectedUnit(selectedUnitName)
      } else {
        // Handle the error (e.g., show a message to the user)
        toast.error('Failed to create a new unit.')
      }
    } catch (error) {
      // Handle the error (e.g., show a message to the user)
      toast.error('Failed to create a new unit.')
    }
  }

  const getUnitIdForSelectedUnit = async (unitName) => {
    try {
      const response = await axios.get(
        'https://connectapi.mosquepay.org/cmd_system_api/v1/api/unit_list',
        config
      )

      // const unitData = response.data.result.find((unit) => unit.unit === unit)
      const unitData = response.data.result.find(
        (unit) => unit.unit.toLowerCase() === unitName.toLowerCase()
      )
      // console.log(unitData)

      if (unitData) {
        const unitId = unitData.unit_id
        // console.log(unitId)
        UploadValue.setFieldValue('unit_id', unitId)
      } else {
        console.log(`Unit '${unitName}' not found.`)
      }
    } catch (error) {
      console.error('Error fetchings data:', error)
    }
  }

  const UploadValue = useFormik({
    initialValues: {
      document_owner: '',
      document_id: '',
      department_id: '',
      unit_id: '',
      phonenumber: '',
      email: '',
      purpose: '',
      // image: null,
      create_by: create_by,
    },
    // validationSchema: Yup.object({
    //   firstname: Yup.string()
    //     .min(3, 'Must be more than three characters')
    //     .required('Required'),
    //   lastname: Yup.string()
    //     .min(3, 'Must be more than three characters')
    //     .required('Required'),
    //   email: Yup.string().email('Invalid email address').required('Required'),
    //   phonenumber_number: Yup.string().required('Provide a valid phone number'),
    // }),
    onSubmit: async () => {
      setLoading(true)
      setError(null)

      const capitalizedDocumentOwner = UploadValue.values.document_owner
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase())

      // Check if there are owners with the same name both in uppercase and lowercase
      const existingOwnersArray = Array.from(existingOwners)
      const existingOwnerIndex = existingOwnersArray.findIndex(
        (owner) =>
          owner.toLowerCase() === capitalizedDocumentOwner.toLowerCase()
      )

      if (existingOwnerIndex !== -1) {
        // Use the existing owner from the list (ensure it's in the same case)
        UploadValue.setFieldValue(
          'document_owner',
          existingOwnersArray[existingOwnerIndex]
        )
      } else {
        // This is a new owner, add it to the list of existing owners
        existingOwners.add(capitalizedDocumentOwner)
      }

      const formData = new FormData()

      // Append the file to the formData if a file is selected
      if (selectedFile) {
        formData.append('image', selectedFile)
        formData.append('imageName', selectedFile.name)
      }

      formData.append('document_owner', UploadValue.values.document_owner)
      formData.append('document_id', UploadValue.values.document_id)
      formData.append('department_id', UploadValue.values.department_id)
      formData.append('unit_id', UploadValue.values.unit_id)
      formData.append('phonenumber', UploadValue.values.phonenumber)
      formData.append('email', UploadValue.values.email)
      formData.append('purpose', UploadValue.values.purpose)
      formData.append('create_by', UploadValue.values.create_by)

      try {
        const response = await axios.post(
          API_BASE + 'user_document_creation',
          formData,
          config
        )
        console.log(response)
        if (+response.data.status_code === 0) {
          toast.success(response.data.message)
          // if (!existingUnits.has(selectedUnitName.toLowerCase())) {
          //   await createUnit()
          // }
          UploadValue.resetForm()
          setSelectedFile(null)
          setSelectedUnitName('')
        } else {
          toast.error(response.data.message)
        }
        setLoading(false)
      } catch (error) {
        console.log(error)
        setError(error)
        setLoading(false)
      }

      const logAuditTrail = (action, url, email) => {
        // Create an audit trail entry
        const auditTrailEntry = {
          inserted_dt: new Date().toISOString(), // Current date and time
          ref_id: create_by,
          action,
          document_name: selectedFile.name,
          email,
          url,
        }

        // Log the audit trail entry
        Audit.logAuditTrail(auditTrailEntry)
      }
      const link = `https://connectapi.mosquepay.org/cmd_system_api/assets/img/useraccount/${selectedFile.name}`
      logAuditTrail('Created Document', link, email)
    },
  })

  useEffect(() => {
    // Fetch options for the second field based on selectedValue1
    if (UploadValue.values.department_id) {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-api-key': 987654,
        },
      }
      axios
        .get(
          API_BASE +
            `unit_list?department_id=${UploadValue.values.department_id}`,
          config
        )
        .then((res) => {
          setUnit(res.data.result)
          // setSuggestedUnits(res.data.result)
          setFetchingData(false)
        })
        .catch((err) => {
          console.log(err)
          setFetchingData(false)
        })
    }
  }, [UploadValue.values.department_id])

  const handleDocumentOwnerChange = (e) => {
    const userInput = e.target.value.toLowerCase()
    const suggestions = Array.from(existingOwners).filter((owner) =>
      owner.toLowerCase().includes(userInput)
    )
    setSuggestedOwners(suggestions)
    // Update your form values with the user input (capitalized)
    UploadValue.setFieldValue('document_owner', e.target.value)
  }

  // const handleUnitChange = (e) => {
  //   const userInput = e.target.value.toLowerCase()
  //   setSelectedUnitName(userInput) // Update selectedUnitName

  //   // Update suggestions based on user input
  //   const suggestions = unit.filter((unitItem) =>
  //     unitItem.unit.toLowerCase().includes(userInput)
  //   )
  //   setSuggestedUnits(suggestions)
  // }

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    UploadValue.setFieldValue('document_owner', suggestion)
    // UploadValue.setFieldValue('department_id', '') // Clear the department selection
    // UploadValue.setFieldValue('unit_id', '')
    fetchOwnerDetails(suggestion)
    setSuggestedOwners([]) // Clear suggestions
  }

  // const handleSuggestionUnitClick = (unitSuggestion) => {
  //   // Update the input field with the selected unit name (for display)
  //   setSelectedUnitName(unitSuggestion.unit)
  //   console.log(unitSuggestion)
  //   setSelectedUnitId(unitSuggestion.unit_id)
  //   // Update the form field with the selected unit_id
  //   UploadValue.setFieldValue('unit_id', unitSuggestion.unit_id)
  //   // Clear the suggestions
  //   setSuggestedUnits([])
  // }

  const fetchOwnerDetails = async (ownerName) => {
    // const config = {
    //   headers: {
    //     'Content-Type': 'multipart/form-data',
    //     'x-api-key': 987654,
    //   },
    // }
    // console.log(ownerName)
    try {
      const response = await axios.get(
        API_BASE + `docu_ment_details?document_owner=${ownerName}`,
        config
      )

      const ownerDetails = response.data.result[0] // Assuming the API returns a single owner's details

      // Populate other form fields with owner details
      UploadValue.setFieldValue('phonenumber', ownerDetails.phonenumber)
      UploadValue.setFieldValue('email', ownerDetails.email)
      // UploadValue.setFieldValue('department_id', ownerDetails.department_id)
      // UploadValue.setFieldValue('unit_id', ownerDetails.unit_id)
    } catch (error) {
      console.error('Error fetching owner details:', error)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between w-full mb-5">
        <div className="flex items-center space-x-5">
          <img
            src={back}
            className="w-6 h-6 cursor-pointer hover:scale-125"
            alt=""
            onClick={goBack}
          />
          <h3 className="flex text-lg font-bold text-left">Upload Document</h3>
        </div>
      </div>
      <form
        onSubmit={UploadValue.handleSubmit}
        autoComplete="off"
        className="grid grid-cols-1 gap-4 md:grid-cols-12 pb-7"
      >
        <div className="col-span-7 md:col-span-5">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-border_color bg-gray-50 dark:hover:bg-bray-800 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <p className="text-sm text-black_color font-bold mb-5 tracking-[0.7px]">
                  Click to add a file
                </p>
                <p className="mb-1 text-sm text-black_color">
                  Supported file types
                </p>
                <p className="text-xs text-black_color">
                  PDF, DOC, XLS, XLSX, DOCS, PPT
                </p>
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf, .doc, .xls, .docx, .xlsx, .png, .jpg"
              />
            </label>
          </div>

          <div>
            <ul>
              {/* {selectedFiles?.map((file, index) => ( */}
              {selectedFile && (
                <li className="flex items-center justify-between px-5 py-2 mt-5 mb-3 rounded bg-dull_white">
                  <div className="flex items-center gap-3">
                    <span>
                      <img src={uploadedFile} className="w-5 h-5" alt="file" />
                    </span>
                    <span className="text-xs font-semibold text-black_color max-w-[18rem]">
                      {selectedFile.name} (
                      {Math.round(selectedFile.size / 1024)} KB)
                    </span>
                  </div>
                  <div>
                    <button onClick={() => handleRemoveFile()} className="pt-1">
                      <img src={close} className="w-4 h-4" alt="" />
                    </button>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
        <div className="col-span-7">
          <div className="grid grid-cols-2 px-5 py-4 border rounded gap-x-4 gap-y-4 border-border_color">
            <div className="col-span-2">
              <label htmlFor="" className="text-xs font-semibold">
                Document Owner
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="document_owner"
                  value={UploadValue.values.document_owner}
                  onChange={handleDocumentOwnerChange}
                  ref={ownerInputRef}
                  onFocus={() => setIsOwnerDropdownOpen(true)}
                  onBlur={() => setIsOwnerDropdownOpen(false)}
                  className="rounded text-sm font-semibold tracking-[0.6px] text-black_color bg-dull_white w-full p-3 focus:bg-white focus:outline-black_color"
                />
                {suggestedOwners.length > 0 && (
                  <ul className="absolute z-10 w-full py-2 mt-2 bg-white border rounded-lg shadow-lg max-h-[8rem] overflow-auto scrollbar-thin scrollbar-thumb-black">
                    {suggestedOwners.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="" className="text-xs font-semibold">
                Document Type
              </label>
              <select
                value={UploadValue.values.document_id}
                name="document_id"
                onChange={UploadValue.handleChange}
                className=" rounded capitalize text-sm font-semibold tracking-[0.6px] text-black_color bg-dull_white w-full p-3 focus:bg-white focus:outline-black_color"
              >
                <option>--</option>
                {documentType.map((doc) => {
                  return (
                    <option key={doc.document_id} value={doc.document_id}>
                      {doc.document_type}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="" className="text-xs font-semibold">
                Department
              </label>
              <select
                value={UploadValue.values.department_id}
                name="department_id"
                onChange={UploadValue.handleChange}
                className="rounded capitalize text-sm font-semibold tracking-[0.6px] text-black_color bg-dull_white w-full p-3 focus:bg-white focus:outline-black_color"
              >
                <option value="">--</option>
                {dept.map((dept) => (
                  <option
                    key={dept.department_id}
                    value={dept.department_id}
                    // selected={
                    //   UploadValue.values.department_id === dept.department_id
                    // }
                  >
                    {dept.department}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative col-span-2 md:col-span-1">
              <label htmlFor="" className="text-xs font-semibold">
                Select Unit
              </label>
              <select
                value={UploadValue.values.unit_id}
                name="unit_id"
                onChange={UploadValue.handleChange}
                className="rounded capitalize text-sm font-semibold tracking-[0.6px] text-black_color bg-dull_white w-full p-3 focus:bg-white focus:outline-black_color"
              >
                <option>--</option>
                {unit.map((unit) => {
                  return (
                    <option
                      key={unit.unit_id}
                      value={unit.unit_id}
                      // selected={UploadValue.values.unit_id === unit.unit_id}
                    >
                      {unit.unit}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="" className="text-xs font-semibold">
                Phone Number
              </label>
              <input
                type="tel"
                name="phonenumber"
                value={UploadValue.values.phonenumber}
                onChange={UploadValue.handleChange}
                className="rounded text-sm font-semibold tracking-[0.6px] text-black_color bg-dull_white w-full p-3 focus:bg-white focus:outline-black_color"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="" className="text-xs font-semibold">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={UploadValue.values.email}
                onChange={UploadValue.handleChange}
                className="rounded text-sm font-semibold tracking-[0.6px] text-black_color bg-dull_white w-full p-3 focus:bg-white focus:outline-black_color"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="" className="text-xs font-semibold">
                Purpose
              </label>
              <textarea
                rows="3"
                name="purpose"
                value={UploadValue.values.purpose}
                onChange={UploadValue.handleChange}
                className="rounded text-sm font-semibold tracking-[0.6px] text-black_color bg-dull_white w-full p-3 focus:bg-white focus:outline-black_color"
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-40 px-4 py-3 text-xs font-semibold rounded bg-green text-black_color"
              disabled={loading}
            >
              {loading ? (
                <ClipLoader
                  loading={loading}
                  size={20}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              ) : (
                'Save Document'
              )}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

export default UploadDocument
