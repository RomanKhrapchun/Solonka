import React, {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom'
import useFetch from "../../hooks/useFetch";
import Table from "../../components/common/Table/Table";
import {generateIcon, iconMap, STATUS} from "../../utils/constants.jsx";
import Button from "../../components/common/Button/Button";
import PageError from "../ErrorPage/PageError";
import Pagination from "../../components/common/Pagination/Pagination";
import {fetchFunction, hasOnlyAllowedParams, validateFilters} from "../../utils/function";
import {useNotification} from "../../hooks/useNotification";
import {Context} from "../../main";
import Dropdown from "../../components/common/Dropdown/Dropdown";
import SkeletonPage from "../../components/common/Skeleton/SkeletonPage";
import Modal from "../../components/common/Modal/Modal.jsx";
import {Transition} from "react-transition-group";
import FilterDropdown from "../../components/common/Dropdown/FilterDropdown";
import "../../components/common/Dropdown/FilterDropdown.css";
import * as XLSX from 'xlsx';

// Іконки для дій
const addIcon = generateIcon(iconMap.add, null, 'currentColor', 20, 20)
const downloadIcon = generateIcon(iconMap.download, null, 'currentColor', 20, 20)
const editIcon = generateIcon(iconMap.edit, null, 'currentColor', 20, 20)
const filterIcon = generateIcon(iconMap.filter, null, 'currentColor', 20, 20)
const searchIcon = generateIcon(iconMap.search, 'input-icon', 'currentColor', 16, 16)
const dropDownIcon = generateIcon(iconMap.arrowDown, null, 'currentColor', 20, 20)
const sortUpIcon = generateIcon(iconMap.arrowUp, 'sort-icon', 'currentColor', 14, 14)
const sortDownIcon = generateIcon(iconMap.arrowDown, 'sort-icon', 'currentColor', 14, 14)
const dropDownStyle = {width: '100%'}
const childDropDownStyle = {justifyContent: 'center'}
const ATTENDANCE_STATE_KEY = 'attendanceState';

const saveAttendanceState = (state) => {
    try {
        sessionStorage.setItem(ATTENDANCE_STATE_KEY, JSON.stringify({
            sendData: state.sendData,
            selectData: state.selectData,
            isFilterOpen: state.isFilterOpen,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.warn('Failed to save attendance state:', error);
    }
};

const loadAttendanceState = () => {
    try {
        const saved = sessionStorage.getItem(ATTENDANCE_STATE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
                return parsed;
            }
        }
    } catch (error) {
        console.warn('Failed to load attendance state:', error);
    }
    return null;
};

const clearAttendanceState = () => {
    try {
        sessionStorage.removeItem(ATTENDANCE_STATE_KEY);
    } catch (error) {
        console.warn('Failed to clear attendance state:', error);
    }
};

const Attendance = () => {
    const navigate = useNavigate()
    const notification = useNotification()
    const {store} = useContext(Context)
    const nodeRef = useRef(null)
    const [stateAttendance, setStateAttendance] = useState(() => {
        const savedState = loadAttendanceState();
        
        if (savedState) {
            return {
                isFilterOpen: savedState.isFilterOpen || false,
                selectData: savedState.selectData || {},
                confirmLoading: false,
                itemId: null,
                sendData: savedState.sendData || {
                    limit: 16,
                    page: 1,
                    sort_by: 'date',
                    sort_direction: 'desc',
                }
            };
        }
        
        return {
            isFilterOpen: false,
            selectData: {},
            confirmLoading: false,
            itemId: null,
            sendData: {
                limit: 16,
                page: 1,
                sort_by: 'date',
                sort_direction: 'desc',
            }
        };
    });
    
    const isFirstAPI = useRef(true);
    const {error, status, data, retryFetch} = useFetch('api/Attendance', {
        method: 'post',
        data: stateAttendance.sendData
    })
    
    const startRecord = ((stateAttendance.sendData.page || 1) - 1) * stateAttendance.sendData.limit + 1;
    const endRecord = Math.min(startRecord + stateAttendance.sendData.limit - 1, data?.totalItems || 1);

    const navigateToAttendance = useCallback((attendanceId) => {
        saveAttendanceState(stateAttendance);
        navigate(`/Attendance/${attendanceId}`);
    }, [navigate, stateAttendance]);        

    useEffect(() => {
        if (isFirstAPI.current) {
            isFirstAPI.current = false;
            return;
        }
        
        retryFetch('api/Attendance', {
            method: 'post',
            data: stateAttendance.sendData,
        });
    }, [stateAttendance.sendData, retryFetch]);

    useEffect(() => {
        saveAttendanceState(stateAttendance);
    }, [stateAttendance]);

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA');
    };

    const getAttendanceStatus = (status) => {
        switch (status) {
            case 'present':
                return (
                    <span style={{
                        color: '#27ae60',
                        fontWeight: 'bold'
                    }}>
                        Присутній
                    </span>
                );
            case 'absent':
                return (
                    <span style={{
                        color: '#e74c3c',
                        fontWeight: 'bold'
                    }}>
                        Відсутній
                    </span>
                );
            case 'sick':
                return (
                    <span style={{
                        color: '#f39c12',
                        fontWeight: 'bold'
                    }}>
                        Хворий
                    </span>
                );
            default:
                return (
                    <span style={{
                        color: '#999',
                        fontWeight: 'bold'
                    }}>
                        Невідомо
                    </span>
                );
        }
    };

    const handleSort = useCallback((dataIndex) => {
        setStateAttendance(prevState => {
            let newDirection = 'desc';
            
            if (prevState.sendData.sort_by === dataIndex) {
                newDirection = prevState.sendData.sort_direction === 'desc' ? 'asc' : 'desc';
            }
            
            return {
                ...prevState,
                sendData: {
                    ...prevState.sendData,
                    sort_by: dataIndex,
                    sort_direction: newDirection,
                    page: 1,
                }
            };
        });
    }, []);

    const getSortIcon = useCallback((dataIndex) => {
        if (stateAttendance.sendData.sort_by !== dataIndex) {
            return null;
        }
        try {
            return stateAttendance.sendData.sort_direction === 'desc' ? sortDownIcon : sortUpIcon;
        } catch (error) {
            console.error('Помилка при створенні іконки сортування:', error);
            return null;
        }
    }, [stateAttendance.sendData.sort_by, stateAttendance.sendData.sort_direction]);

    const columnTable = useMemo(() => {
        const createSortableColumn = (title, dataIndex, render = null, width = null) => ({
            title,
            dataIndex,
            sortable: true,
            onHeaderClick: () => handleSort(dataIndex),
            sortIcon: getSortIcon(dataIndex),
            headerClassName: stateAttendance.sendData.sort_by === dataIndex ? 'active' : '',
            ...(width && { width }),
            ...(render && { render })
        });

        let columns = [
            createSortableColumn('Дата', 'date', (date) => formatDate(date), '120px'),
            createSortableColumn('ПІБ дитини', 'child_name', null, '200px'),
            createSortableColumn('Номер садочка', 'kindergarten_number', null, '120px'),
            createSortableColumn('Група', 'group_name', null, '150px'),
            createSortableColumn('Тип групи', 'group_type', null, '120px'),
            createSortableColumn('Статус', 'attendance_status', (status) => getAttendanceStatus(status), '120px'),
            {
                title: 'Дії',
                dataIndex: 'action',
                headerClassName: 'non-sortable',
                width: '120px',
                render: (_, record) => (
                    <div className="btn-sticky" style={{
                        justifyContent: 'center', 
                        gap: '1px', 
                        flexWrap: 'wrap'
                    }}>
                        <Button
                            title="Переглянути"
                            icon={editIcon}
                            size="small"
                            onClick={() => navigateToAttendance(record.id)}
                        />
                        <Button
                            title="Редагувати"
                            icon={editIcon}
                            size="small"
                            onClick={() => navigate(`/Attendance/${record.id}/edit`)}
                        />
                    </div>
                ),
            }
        ];

        return columns;
    }, [navigate, handleSort, getSortIcon, stateAttendance.sendData.sort_by]);

    const tableData = useMemo(() => {
        if (data?.items?.length) {
            const result = data?.items?.map(el => {
                return {
                    key: el.id,
                    id: el.id,
                    date: el.date,
                    child_name: el.child_name,
                    kindergarten_number: el.kindergarten_number,
                    group_name: el.group_name,
                    group_type: el.group_type,
                    attendance_status: el.attendance_status,
                }
            });
            return result;
        }
        return []
    }, [data])

    const itemMenu = [
        {
            label: '16',
            key: '16',
            onClick: () => {
                if (stateAttendance.sendData.limit !== 16) {
                    setStateAttendance(prevState => ({
                        ...prevState,
                        sendData: {
                            ...prevState.sendData,
                            limit: 16,
                            page: 1,
                        }
                    }))
                }
            },
        },
        {
            label: '32',
            key: '32',
            onClick: () => {
                if (stateAttendance.sendData.limit !== 32) {
                    setStateAttendance(prevState => ({
                        ...prevState,
                        sendData: {
                            ...prevState.sendData,
                            limit: 32,
                            page: 1,
                        }
                    }))
                }
            },
        },
        {
            label: '48',
            key: '48',
            onClick: () => {
                if (stateAttendance.sendData.limit !== 48) {
                    setStateAttendance(prevState => ({
                        ...prevState,
                        sendData: {
                            ...prevState.sendData,
                            limit: 48,
                            page: 1,
                        }
                    }))
                }
            },
        },
    ]

    const filterHandleClick = () => {
        setStateAttendance(prevState => ({
            ...prevState,
            isFilterOpen: !prevState.isFilterOpen,
        }))
    }

    const closeFilterDropdown = () => {
        setStateAttendance(prevState => ({
            ...prevState,
            isFilterOpen: false,
        }))
    }

    const hasActiveFilters = useMemo(() => {
        return Object.values(stateAttendance.selectData).some(value => {
            if (Array.isArray(value) && !value.length) {
                return false
            }
            return value !== null && value !== undefined && value !== ''
        })
    }, [stateAttendance.selectData])

    const onHandleChange = (name, value) => {
        setStateAttendance(prevState => ({
            ...prevState,
            selectData: {
                ...prevState.selectData,
                [name]: value
            }
        }))
    }

    const resetFilters = () => {
        setStateAttendance(prevState => ({
            ...prevState,
            selectData: {},
            isFilterOpen: false,
            sendData: {
                limit: prevState.sendData.limit,
                page: 1,
                sort_by: prevState.sendData.sort_by,
                sort_direction: prevState.sendData.sort_direction,
            }
        }));
    }

    const applyFilter = () => {
        const isAnyInputFilled = Object.values(stateAttendance.selectData).some(value => {
            if (Array.isArray(value) && !value.length) {
                return false
            }
            return value
        })
        
        if (isAnyInputFilled) {
            const dataValidation = validateFilters(stateAttendance.selectData)
            if (!dataValidation.error) {
                const filterParams = {
                    ...stateAttendance.selectData,
                    ...dataValidation
                }
                
                setStateAttendance(prevState => ({
                    ...prevState,
                    sendData: {
                        ...filterParams,
                        limit: prevState.sendData.limit,
                        page: 1,
                        sort_by: prevState.sendData.sort_by,
                        sort_direction: prevState.sendData.sort_direction,
                    },
                    isFilterOpen: false
                }))
            } else {
                notification({
                    type: 'warning',
                    placement: 'top',
                    title: 'Помилка',
                    message: dataValidation.message ?? 'Щось пішло не так.',
                })
            }
        } else {
            setStateAttendance(prevState => ({
                ...prevState,
                sendData: {
                    limit: prevState.sendData.limit,
                    page: 1,
                    sort_by: prevState.sendData.sort_by,
                    sort_direction: prevState.sendData.sort_direction,
                },
                isFilterOpen: false
            }))
        }
    }

    const onPageChange = useCallback((page) => {
        if (stateAttendance.sendData.page !== page) {
            setStateAttendance(prevState => ({
                ...prevState,
                sendData: {
                    ...prevState.sendData,
                    page,
                }
            }))
        }
    }, [stateAttendance.sendData.page])

    const exportToExcel = async () => {
        try {
            const exportParams = {
                ...stateAttendance.sendData,
                page: 1,
                limit: 10000,
                ...Object.fromEntries(
                    Object.entries(stateAttendance.selectData).filter(([_, value]) => {
                        if (Array.isArray(value)) return value.length > 0;
                        return value !== null && value !== undefined && value !== '' && value !== false;
                    })
                )
            };

            const response = await fetch("/api/Attendance/export", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(exportParams)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const apiData = await response.json();

            if (!apiData.items || !Array.isArray(apiData.items)) {
                throw new Error("Неправильна структура даних");
            }

            const excelData = [];
            const headers = ['Дата', 'ПІБ дитини', 'Номер садочка', 'Група', 'Тип групи', 'Статус відвідування'];
            excelData.push(headers);

            apiData.items.forEach(attendance => {
                const statusMapping = {
                    'present': 'Присутній',
                    'absent': 'Відсутній',
                    'sick': 'Хворий'
                };

                const row = [
                    formatDate(attendance.date) || '',
                    attendance.child_name || '',
                    attendance.kindergarten_number || '',
                    attendance.group_name || '',
                    attendance.group_type || '',
                    statusMapping[attendance.attendance_status] || attendance.attendance_status || ''
                ];
                excelData.push(row);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(excelData);
            
            const colWidths = [
                { wch: 12 }, // Дата
                { wch: 25 }, // ПІБ дитини
                { wch: 15 }, // Номер садочка
                { wch: 20 }, // Група
                { wch: 15 }, // Тип групи
                { wch: 18 }, // Статус відвідування
            ];

            worksheet['!cols'] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Відвідування");

            const currentDate = new Date().toISOString().split('T')[0];
            const filterInfo = Object.keys(stateAttendance.selectData).filter(key => stateAttendance.selectData[key]).length > 0 
                ? '_filtered' 
                : '';
            
            const fileName = `відвідування_${currentDate}${filterInfo}.xlsx`;

            XLSX.writeFile(workbook, fileName);

            notification({
                type: "success",
                placement: "top",
                title: "Успіх",
                message: `Дані відвідування успішно експортовано (${apiData.items.length} записів)`
            });

        } catch (error) {
            notification({
                type: "error",
                placement: "top",
                title: "Помилка",
                message: "Не вдалося експортувати дані відвідування"
            });
            console.error("Export error:", error);
        }
    };

    if (status === STATUS.ERROR) {
        return <PageError title={error.message} statusError={error.status}/>
    }

    return (
        <React.Fragment>
            {status === STATUS.PENDING ? <SkeletonPage/> : null}
            {status === STATUS.SUCCESS ?
                <React.Fragment>
                    <div className="table-elements">
                        <div className="table-header">
                            <h2 className="title title--sm">
                                {data?.items && Array.isArray(data?.items) && data?.items.length > 0 ?
                                    <React.Fragment>
                                        Показує {startRecord !== endRecord ? `${startRecord}-${endRecord}` : startRecord} з {data?.totalItems || 1}
                                    </React.Fragment> : <React.Fragment>Записів не знайдено</React.Fragment>
                                }
                            </h2>
                            <div className="table-header__buttons">
                                <Dropdown
                                    icon={dropDownIcon}
                                    iconPosition="right"
                                    style={dropDownStyle}
                                    childStyle={childDropDownStyle}
                                    caption={`Записів: ${stateAttendance.sendData.limit}`}
                                    menu={itemMenu}/>
                                <Button
                                    className={`table-filter-trigger ${hasActiveFilters ? 'has-active-filters' : ''}`}
                                    onClick={filterHandleClick}
                                    icon={filterIcon}>
                                    Фільтри {hasActiveFilters && `(${Object.keys(stateAttendance.selectData).filter(key => stateAttendance.selectData[key]).length})`}
                                </Button>
                                <Button
                                    onClick={exportToExcel}
                                    icon={downloadIcon}>
                                    Завантажити
                                </Button>
                                <Button
                                    onClick={() => navigate('/Attendance/create')}
                                    icon={addIcon}>
                                    Додати запис
                                </Button>
                                <FilterDropdown
                                    isOpen={stateAttendance.isFilterOpen}
                                    onClose={closeFilterDropdown}
                                    filterData={stateAttendance.selectData}
                                    onFilterChange={onHandleChange}
                                    onApplyFilter={applyFilter}
                                    onResetFilters={resetFilters}
                                    searchIcon={searchIcon}
                                />
                            </div>
                        </div>
                        <div className="table-main">
                            <div className="table-and-pagination-wrapper">
                                <div className="table-wrapper" style={{
                                    overflowX: 'auto',
                                    minWidth: data?.items?.length > 0 ? '1100px' : 'auto'
                                }}>
                                    <Table columns={columnTable} dataSource={tableData}/>
                                </div>
                                <Pagination
                                    className="m-b"
                                    currentPage={parseInt(data?.currentPage) || 1}
                                    totalCount={data?.totalItems || 1}
                                    pageSize={stateAttendance.sendData.limit}
                                    onPageChange={onPageChange}/>
                            </div>
                        </div>
                    </div>
                </React.Fragment> : null
            }
        </React.Fragment>
    )
};

export default Attendance;