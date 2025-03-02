import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {
    TextField,
    Box,
    Typography,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    CircularProgress,
    Fab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import DescriptionIcon from '@mui/icons-material/Description';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import axios from 'axios';
import FolderIcon from '@mui/icons-material/Folder';

const theme = createTheme({
    palette: {
        primary: {main: '#1976d2'},
        secondary: {main: '#ff9800'},
        green: {main: '#4CAF50'},
        red: {main: '#f44336'},
    },
});

function EditPortfolio() {
    const {portfolioId} = useParams();
    const navigate = useNavigate();
    const [portfolio, setPortfolio] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [newImages, setNewImages] = useState([]); // 새로 업로드된 이미지 파일 상태
    const [newFiles, setNewFiles] = useState([]); // 새로 업로드된 파일 상태
    const [existingImages, setExistingImages] = useState([]); // 기존에 등록된 이미지 상태
    const [existingFiles, setExistingFiles] = useState([]); // 기존에 등록된 파일 상태
    const [validImageIds, setValidImageIds] = useState([]); // 유효한 이미지 ID (추가 및 기존 유지)
    const [validFileIds, setValidFileIds] = useState([]); // 유효한 파일 ID (추가 및 기존 유지)
    const [deletedImageIds, setDeletedImageIds] = useState([]); // 삭제된 이미지 ID
    const [deletedFileIds, setDeletedFileIds] = useState([]); // 삭제된 파일 ID
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const MAX_IMAGES = 3; // 이미지 최대 개수 (독립적)
    const MAX_FILES = 3; // 파일 최대 개수 (독립적)
    const ALLOWED_FILE_EXTENSIONS = ['.txt', '.md', '.doc', '.docx']; // 텍스트 파일 확장자 제한

    // 포트폴리오 데이터 로드 (상세조회 API 호출)
    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    navigate('/login');
                    return;
                }

                const response = await axios.get(`${process.env.REACT_APP_API_URL}/portfolios/${portfolioId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status === 401) {
                    navigate('/login');
                    return;
                }

                if (response.data.success_or_fail) {
                    const data = response.data.data;
                    setPortfolio(data);
                    setTitle(data.title || '');
                    setContent(data.content || '');
                    // 기존 이미지와 파일을 분리하여 저장
                    const images = data.file_list.filter(file => file.file_type === 'IMAGE') || [];
                    const files = data.file_list.filter(file => file.file_type === 'FILE') || [];
                    setExistingImages(images);
                    setExistingFiles(files);
                    setValidImageIds(images.map(file => file.id));
                    setValidFileIds(files.map(file => file.id));
                } else {
                    throw new Error(response.data.message || '포트폴리오 로드 실패');
                }
            } catch (err) {
                setUploadError('포트폴리오 로드 중 오류가 발생했습니다: ' + err.message);
                if (err.response?.status === 401) {
                    navigate('/login');
                    return;
                }
            }
        };

        fetchPortfolio();
    }, [portfolioId, navigate]);

    // 유효한 이미지 수 계산 (삭제된 이미지 제외, 새로 추가된 이미지 포함)
    const getValidImageCount = () => {
        const validExistingImages = existingImages.filter(image => !deletedImageIds.includes(image.id)).length;
        return validExistingImages + newImages.length;
    };

    // 유효한 파일 수 계산 (삭제된 파일 제외, 새로 추가된 파일 포함)
    const getValidFileCount = () => {
        const validExistingFiles = existingFiles.filter(file => !deletedFileIds.includes(file.id)).length;
        return validExistingFiles + newFiles.length;
    };

    // 이미지 입력 필드 클릭 시 제한 확인
    const handleImageInputClick = (event) => {
        if (getValidImageCount() >= MAX_IMAGES) {
            event.preventDefault();
            alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
        }
        console.log('Image input clicked');
    };

    // 파일 입력 필드 클릭 시 제한 확인
    const handleFileInputClick = (event) => {
        if (getValidFileCount() >= MAX_FILES) {
            event.preventDefault();
            alert(`파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`);
        }
        console.log('File input clicked');
    };

    // 이미지 업로드 핸들러 (Presigned URL 사용)
    const handleImageUpload = async (event) => {
        console.log('Image upload triggered');
        const newImages = Array.from(event.target.files).filter(file => file.type.startsWith('image/')); // 이미지 파일만 필터링

        if (getValidImageCount() + newImages.length > MAX_IMAGES) {
            alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const uploadPromises = newImages.map(async (file) => {
                console.log('Uploading image:', file.name);
                const presignedResponse = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, {
                    directory: `${process.env.REACT_APP_S3_PORTFOLIO_DIRECTORY}`,
                    id: portfolioId,
                    file_type: `${process.env.REACT_APP_S3_IMAGE_TYPE}`,
                    file_name: file.name,
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (presignedResponse.status === 401) {
                    navigate('/login');
                    return;
                }

                if (!presignedResponse.data.success_or_fail) {
                    throw new Error(presignedResponse.data.message || 'Presigned URL 요청 실패');
                }

                const presignedUrl = presignedResponse.data.data.uploading_image_url;
                const fileEntityId = presignedResponse.data.data.image_entity_id;

                await axios.put(presignedUrl, file, {headers: {'Content-Type': file.type || 'application/octet-stream'}});

                setValidImageIds(prevIds => [...prevIds, fileEntityId]);
                return {file, entityId: fileEntityId};
            });

            const uploadedImages = await Promise.all(uploadPromises);
            setNewImages(prev => [...prev, ...uploadedImages.map(item => item.file)]);
            console.log('Images uploaded:', uploadedImages);
        } catch (err) {
            console.error('Image upload error:', err);
            setUploadError('이미지 업로드 실패: ' + (err.response?.data?.message || err.message));
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
        } finally {
            setUploading(false);
        }
    };

    // 파일 업로드 핸들러 (Presigned URL 사용)
    const handleFileUpload = async (event) => {
        console.log('File upload triggered');
        const newFiles = Array.from(event.target.files).filter(file => {
            const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            return ALLOWED_FILE_EXTENSIONS.includes(extension);
        }); // 텍스트 파일만 필터링

        if (getValidFileCount() + newFiles.length > MAX_FILES) {
            alert(`파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`);
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const uploadPromises = newFiles.map(async (file) => {
                console.log('Uploading file:', file.name);
                const presignedResponse = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, {
                    directory: `${process.env.REACT_APP_S3_PORTFOLIO_DIRECTORY}`,
                    id: portfolioId,
                    file_type: `${process.env.REACT_APP_S3_FILE_TYPE}`,
                    file_name: file.name,
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                        'Content-Type': 'application/json'
                    },
                });

                if (presignedResponse.status === 401) {
                    navigate('/login');
                    return;
                }

                if (!presignedResponse.data.success_or_fail) {
                    throw new Error(presignedResponse.data.message || 'Presigned URL 요청 실패');
                }

                const presignedUrl = presignedResponse.data.data.uploading_image_url;
                const fileEntityId = presignedResponse.data.data.image_entity_id;

                await axios.put(presignedUrl, file, {headers: {'Content-Type': file.type || 'application/octet-stream'}});

                setValidFileIds(prevIds => [...prevIds, fileEntityId]);
                return {file, entityId: fileEntityId};
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            setNewFiles(prev => [...prev, ...uploadedFiles.map(item => item.file)]);
            console.log('Files uploaded:', uploadedFiles);
        } catch (err) {
            console.error('File upload error:', err);
            setUploadError('파일 업로드 실패: ' + (err.response?.data?.message || err.message));
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
        } finally {
            setUploading(false);
        }
    };

    // 기존 이미지 삭제 핸들러
    const handleExistingImageRemove = (imageId, index) => {
        setUploading(true);
        setUploadError(null);

        try {
            setDeletedImageIds(prev => [...prev, imageId]);
            setExistingImages(prev => prev.filter((_, i) => i !== index));
            setValidImageIds(prev => prev.filter(id => id !== imageId));
            console.log('Deleted Image ID:', imageId, 'Valid Image IDs:', validImageIds);
        } catch (err) {
            setUploadError('기존 이미지 삭제 실패: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // 새 이미지 삭제 핸들러
    const handleNewImageRemove = (index) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setValidImageIds(prev => prev.filter(id => !newImages[index]?.entityId || id !== newImages[index].entityId));
        console.log('Removed new image at index:', index, 'Valid Image IDs:', validImageIds);
    };

    // 기존 파일 삭제 핸들러
    const handleExistingFileRemove = (fileId, index) => {
        setUploading(true);
        setUploadError(null);

        try {
            setDeletedFileIds(prev => [...prev, fileId]);
            setExistingFiles(prev => prev.filter((_, i) => i !== index));
            setValidFileIds(prev => prev.filter(id => id !== fileId));
            console.log('Deleted File ID:', fileId, 'Valid File IDs:', validFileIds);
        } catch (err) {
            setUploadError('기존 파일 삭제 실패: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // 새 파일 삭제 핸들러
    const handleNewFileRemove = (index) => {
        setNewFiles(prev => prev.filter((_, i) => i !== index));
        setValidFileIds(prev => prev.filter(id => !newFiles[index]?.entityId || id !== newFiles[index].entityId));
        console.log('Removed new file at index:', index, 'Valid File IDs:', validFileIds);
    };

    // 폼 제출 핸들러 (수정 API 호출)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            navigate('/login');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const requestData = {
                title: title,
                content: content,
                valid_file_ids: [...validImageIds, ...validFileIds], // 유효한 이미지 ID + 유효한 파일 ID
                deleted_file_ids: [...deletedImageIds, ...deletedFileIds], // 삭제된 이미지 ID + 삭제된 파일 ID
            };

            console.log('Submitting data:', requestData);

            const response = await axios.put(`${process.env.REACT_APP_API_URL}/portfolios/${portfolioId}`, requestData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (response.status === 204) { // No Content
                navigate('/profile');
                return;
            }

            if (response.data.success_or_fail) {
                navigate('/profile');
            } else {
                throw new Error(response.data.message || '포트폴리오 수정 실패');
            }
        } catch (err) {
            setUploadError('포트폴리오 수정 중 오류가 발생했습니다: ' + err.message);
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
        } finally {
            setUploading(false);
        }
    };

    // 취소 핸들러
    const handleCancel = () => {
        if (window.confirm('수정을 취소하시겠습니까?')) {
            navigate(-1); // 이전 페이지로 돌아가기
        }
    };

    if (uploadError) return <div>오류: {uploadError}</div>;
    if (!portfolio) return <div>포트폴리오 데이터를 찾을 수 없습니다.</div>;

    return (
        <ThemeProvider theme={theme}>
            <div style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontSize: '24px',
                        color: '#e50914', // 넷플릭스 레드 컬러
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <FolderIcon sx={{color: '#e50914'}}/> 포트폴리오 수정
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{mt: 2}}>
                    <TextField
                        fullWidth
                        label="제목 *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        margin="normal"
                        required
                        variant="outlined"
                        sx={{backgroundColor: '#fff', borderRadius: 1}}
                    />
                    <TextField
                        fullWidth
                        label="설명 *"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        margin="normal"
                        multiline
                        rows={6}
                        required
                        variant="outlined"
                        sx={{backgroundColor: '#fff', borderRadius: 1}}
                    />
                    <Box sx={{mt: 2}}>
                        {/* 이미지 추가 버튼 (파란색, 두 개의 아이콘 포함) */}
                        <Fab
                            variant="extended"
                            color="primary"
                            component="label"
                            sx={{backgroundColor: '#1976d2', '&:hover': {backgroundColor: '#1565c0'}, mb: 2}}
                        >
                            <AddPhotoAlternateIcon sx={{mr: 1}}/>
                            <CameraAltIcon sx={{mr: 1}}/> 이미지 추가
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={handleImageUpload}
                                onClick={handleImageInputClick}
                            />
                        </Fab>
                        {/* 파일 추가 버튼 (주황색, 두 개의 아이콘 포함) */}
                        <Fab
                            variant="extended"
                            color="secondary"
                            component="label"
                            sx={{backgroundColor: '#ff9800', '&:hover': {backgroundColor: '#f57c00'}, mb: 2, ml: 2}}
                        >
                            <DescriptionIcon sx={{mr: 1}}/>
                            <InsertDriveFileIcon sx={{mr: 1}}/> 파일 추가
                            <input
                                type="file"
                                accept={ALLOWED_FILE_EXTENSIONS.join(',')} // 텍스트 파일 확장자만 허용
                                multiple
                                hidden
                                onChange={handleFileUpload}
                                onClick={handleFileInputClick}
                            />
                        </Fab>
                        <Typography variant="body2" color="text.secondary">
                            {`선택된 이미지: ${getValidImageCount()}/${MAX_IMAGES}, 선택된 파일: ${getValidFileCount()}/${MAX_FILES}`}
                        </Typography>
                        <ImageList sx={{width: '100%', mt: 2}} cols={Math.min(getValidImageCount() || 1, 3)}
                                   rowHeight={500}>
                            {/* 기존 이미지 표시 */}
                            {existingImages
                                .filter(image => !deletedImageIds.includes(image.id))
                                .map((image, index) => (
                                    <ImageListItem key={image.id}>
                                        <img
                                            src={image.file_url}
                                            alt={`기존 이미지 ${index + 1}`}
                                            loading="lazy"
                                            style={{objectFit: 'cover', width: '100%', height: '100%'}}
                                            onError={(e) => {
                                                e.target.src = 'https://picsum.photos/500/500?text=Image+Not+Found';
                                            }}
                                        />
                                        <ImageListItemBar
                                            sx={{
                                                background: 'rgba(0, 0, 0, 0.5)',
                                                position: 'absolute',
                                                top: 0,
                                                right: 0,
                                            }}
                                            actionIcon={
                                                <IconButton
                                                    sx={{color: 'white'}}
                                                    onClick={() => handleExistingImageRemove(image.id, index)}
                                                    aria-label={`기존 이미지 삭제 ${index + 1}`}
                                                >
                                                    <CloseIcon/>
                                                </IconButton>
                                            }
                                        />
                                    </ImageListItem>
                                ))}
                            {/* 새 이미지 표시 */}
                            {newImages.map((file, index) => (
                                <ImageListItem key={file.name}>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`새 이미지 ${index + 1}`}
                                        loading="lazy"
                                        style={{objectFit: 'cover', width: '100%', height: '100%'}}
                                    />
                                    <ImageListItemBar
                                        sx={{
                                            background: 'rgba(0, 0, 0, 0.5)',
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                        }}
                                        actionIcon={
                                            <IconButton
                                                sx={{color: 'white'}}
                                                onClick={() => handleNewImageRemove(index)}
                                                aria-label={`새 이미지 삭제 ${index + 1}`}
                                            >
                                                <CloseIcon/>
                                            </IconButton>
                                        }
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                        {/* 기존 파일 표시 */}
                        {existingFiles
                            .filter(file => !deletedFileIds.includes(file.id))
                            .map((file, index) => (
                                <Box key={file.id} sx={{mt: 1, display: 'flex', alignItems: 'center', gap: 0.5}}>
                                    <Typography variant="body2" sx={{flexGrow: 1, fontSize: 14}}>
                                        {file.file_name}
                                    </Typography>
                                    <IconButton
                                        sx={{color: 'gray', p: 0.25}}
                                        onClick={() => handleExistingFileRemove(file.id, index)}
                                        aria-label={`기존 파일 삭제 ${file.file_name}`}
                                    >
                                        <CloseIcon sx={{fontSize: 14}}/>
                                    </IconButton>
                                </Box>
                            ))}
                        {/* 새 파일 표시 */}
                        {newFiles.map((file, index) => (
                            <Box key={file.name} sx={{mt: 1, display: 'flex', alignItems: 'center', gap: 0.5}}>
                                <Typography variant="body2" sx={{flexGrow: 1, fontSize: 14}}>
                                    {file.name}
                                </Typography>
                                <IconButton
                                    sx={{color: 'gray', p: 0.25}}
                                    onClick={() => handleNewFileRemove(index)}
                                    aria-label={`새 파일 삭제 ${file.name}`}
                                >
                                    <CloseIcon sx={{fontSize: 14}}/>
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                    {uploading && <CircularProgress sx={{mt: 2}}/>}
                    {uploadError && (
                        <Typography variant="body1" color="error.main" sx={{mt: 2}}>
                            {uploadError}
                        </Typography>
                    )}
                    <Box sx={{mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2}}>
                        <Fab
                            color="red"
                            aria-label="cancel"
                            sx={{
                                backgroundColor: theme.palette.red.main,
                                '&:hover': {backgroundColor: '#d32f2f', transform: 'scale(1.05)'},
                                borderRadius: '50%',
                            }}
                            onClick={handleCancel}
                        >
                            <CancelIcon sx={{color: '#fff'}}/>
                        </Fab>
                        <Fab
                            type="submit"
                            color="green"
                            aria-label="submit"
                            sx={{
                                backgroundColor: theme.palette.green.main,
                                '&:hover': {backgroundColor: '#45a049', transform: 'scale(1.05)'},
                                borderRadius: '50%',
                            }}
                        >
                            <EditIcon sx={{color: '#fff'}}/>
                        </Fab>
                    </Box>
                </Box>
            </div>
        </ThemeProvider>
    );
}

export default EditPortfolio;