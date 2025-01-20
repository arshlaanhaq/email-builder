import React, { useState, useRef } from "react";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./style.css";

function Editor() {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);

    const titleEditorRef = useRef(null);
    const contentEditorRef = useRef(null);

    // Toolbar configuration for title (only H1 allowed)
    const titleQuillModules = {
        toolbar: [
            [{ header: [1] }], // Only H1
            ["bold", "italic", "underline"],
        ],
    };

    // Toolbar configuration for content
    const contentQuillModules = {
        toolbar: [
            
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
        ],
    };

    // Handle title changes
    const handleTitleChange = (value) => {
        setTitle(value);
    };

    // Handle content changes
    const handleContentChange = (value) => {
        setContent(value);
    };

    // Handle image upload
    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("image", file);

        try {
            setLoading(true);
            const response = await axios.post("https://email-template-builder-7sb4.onrender.com/uploadImage", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            setImageUrl(response.data.imageUrl);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error("Error uploading image:", error);
            alert("Image upload failed!");
        }
    };

    // Handle save template and download
    const handleSaveAndDownloadTemplate = async () => {
        if (!title || !content || !imageUrl) {
            alert("All fields are required to be filled");
            return;
        }

        try {
            setLoading(true);

            // Save the email template
            await axios.post("https://email-template-builder-7sb4.onrender.com/uploadEmailConfig", {
                title,
                content,
                imageUrl,
            });

            // Fetch the email layout
            const response = await axios.post("https://email-template-builder-7sb4.onrender.com/renderAndDownloadTemplate", {
                title,
                content,
                imageUrl,
            }, {
                responseType: "blob",
            });


            const blob = new Blob([response.data], { type: "text/html" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.setAttribute("download", "email-template.html");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setLoading(false);

        } catch (error) {
            setLoading(false);
            console.error("Error saving or downloading template:", error);
            alert("Failed to save or download template!");
        }
    };

    return (
        <div className="editor-container">
            {/* Form Section */}
            <div className="form-section">
                <h2>Email Builder</h2>
                <div style={{ margin: "26px" }}>
                    <label>Upload Logo:</label>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    {loading && <p>Uploading Logo...</p>}
                </div>

                <div style={{ margin: "33px" }}>
                    <label>Title:</label>
                    <ReactQuill
                        ref={titleEditorRef}
                        theme="snow"
                        value={title}
                        onChange={handleTitleChange}
                        modules={titleQuillModules}
                        formats={["header", "bold", "italic", "underline"]}
                        placeholder="Enter your title here"
                    />
                </div>

                <div style={{ margin: "33px" }}>
                    <label>Content:</label>
                    <ReactQuill
                        ref={contentEditorRef}
                        theme="snow"
                        value={content}
                        onChange={handleContentChange}
                        modules={contentQuillModules}
                        placeholder="Enter your content here"
                    />
                </div>

               <div className="button-container">
    <button onClick={handleSaveAndDownloadTemplate} disabled={loading}>
        {loading ? "Saving..." : "Save & Download Template"}
    </button>
</div>

            </div>

            {/* Preview Section */}
            <div className="preview-panel">
                <div className="image-container">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Uploaded Logo" className="circular-image" />
                    ) : (
                        <p>Logo Preview</p>
                    )}
                </div>
                <div
                    onClick={() => titleEditorRef.current.getEditor().focus()}
                    style={{
                        cursor: "pointer",
                        border: "1px solid #ccc",
                        padding: "10px",
                        marginBottom: "10px",
                        justifyContent: "center",
                        display: "flex",
                    }}
                >
                    <div
                        dangerouslySetInnerHTML={{
                            __html: title || "<h1>Click here to edit your title</h1>",
                        }}
                    />
                </div>

                <div
                    onClick={() => contentEditorRef.current.getEditor().focus()}
                    style={{
                        cursor: "pointer",
                        border: "1px dashed #ccc",
                        padding: "10px",
                        marginTop: "10px",
                    }}
                >
                    <div
                        dangerouslySetInnerHTML={{
                            __html: content || "<p>Click here to edit your content</p>",
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

export default Editor;
