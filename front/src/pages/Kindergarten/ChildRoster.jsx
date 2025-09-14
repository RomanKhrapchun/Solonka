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
const phoneIcon = generateIcon(iconMap.phone, null, 'currentColor', 20, 20)
const dropDownStyle = {width: '100%'}
const childDropDownStyle = {justifyContent: 'center'}
const CHILD_ROSTER_STATE_KEY = 'childRosterState';

const saveChildRosterState = (state) => {
    try {
        sessionStorage.setItem(CHILD_ROSTER_STATE_KEY, JSON.stringify({
            sendData: state.sendData,
            selectData: state.selectData,
            isFilterOpen: state.isFilterOpen,
            timestamp: Date.now()
        }));
    } catch (error) {
        console.warn('Failed to save child roster state:', error);
    }
};

const loadChildRosterState = () => {
    try {
        const saved = sessionStorage.getItem(CHILD_ROSTER_STATE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Date.now() - parsed.timestamp < 30 * 60 * 1000) {
                return parsed;
            }
        }
    } catch (error) {
        console.warn('Failed to load child roster state:', error);
    }
    return null;
};

const clearChildRosterState = () => {
    try {
        sessionStorage.removeItem(CHILD_ROSTER_STATE_KEY);
    } catch (error) {
        console.warn('Failed to clear child roster state:', error);
    }
};

const ChildRoster = () => {
    const navigate = useNavigate()
    const notification = useNotification()
    const {store} = useContext(Context)
    const nodeRef = useRef(null)
    const [stateChildren, setStateChildren] = useState(() => {
        const savedState = loadChildRosterState();
        
        if (savedState) {
            return {
                isFilterOpen: savedState.isFilterOpen || false,
                selectData: savedState.selectData || {},
                confirmLoading: false,
                itemId: null,
                sendData: savedState.sendData || {
                    limit: 16,
                    page: 1,
                    sort_by: 'child_name',
                    sort_direction: 'asc',
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
                sort_by: 'child_name',
                sort_direction: 'asc',
            }
        };
    });
    
    const isFirstAPI = useRef(true);
    const {error, status, data, retryFetch} = useFetch('api/Child_roster', {
        method: 'post',
        data: stateChildren.sendData
    })
    
    const startRecord = ((stateChildren.sendData.page || 1) - 1) * stateChildren.sendData.limit + 1;
    const endRecord = Math.min(startRecord + stateChildren.sendData.limit - 1, data?.totalItems || 1);

    const navigateToChild = useCallback((childId) => {
        saveChildRosterState(stateChildren);
        navigate(`/Child_roster/${childId}`);
    }, [navigate, stateChildren]);        

    useEffect(() => {
        if (isFirstAPI.current) {
            isFirstAPI.current = false;
            return;
        }
        
        retryFetch('api/Child_roster', {
            method: 'post',
            data: stateChildren.sendData,
        });
    }, [stateChildren.sendData, retryFetch]);

    useEffect(() => {
        saveChildRosterState(stateChildren);
    }, [stateChildren]);

    const handleSort = useCallback((dataIndex) => {
        setStateChildren(prevState => {
            let newDirection = 'asc';
            
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
        if (stateChildren.sendData.sort_by !== dataIndex) {
            return null;
        }
        try {
            return stateChildren.sendData.sort_direction === 'desc' ? sortDownIcon : sortUpIcon;
        } catch (error) {
            console.error('Помилка при створенні іконки сортування:', error);
            return null;
        }
    }, [stateChildren.sendData.sort_by, stateChildren.sendData.sort_direction]);

    const columnTable = useMemo(() => {
        const createSortableColumn = (title, dataIndex, render = null, width = null) => ({
            title,
            dataIndex,
            sortable: true,
            onHeaderClick: () => handleSort(dataIndex),
            sortIcon: getSortIcon(dataIndex),
            headerClassName: stateChildren.sendData.sort_by === dataIndex ? 'active' : '',
            ...(width && { width }),
            ...(render && { render })
        });

        let columns = [
            createSortableColumn('ПІБ дитини', 'child_name', null, '200px'),
            createSortableColumn('ПІБ батьків', 'parent_name', null, '200px'),
            createSortableColumn('Контактний номер', 'phone', (phone) => {
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {phone && (
                            <>
                                <span>{phone}</span>
                                <Button
                                    title="Зателефонувати"
                                    icon={phoneIcon}
                                    size="small"
                                    style={{
                                        backgroundColor: '#27ae60',
                                        borderColor: '#27ae60',
                                        color: 'white'
                                    }}
                                    onClick={() => window.open(`tel:${phone}`)}
                                />
                            </>
                        )}
                        {!phone && <span style={{color: '#999'}}>Немає номера</span>}
                    </div>
                );
            }, '180px'),
            createSortableColumn('Група', 'group_name', null, '150px'),
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
                            onClick={() => navigateToChild(record.id)}
                        />
                        <Button
                            title="Редагувати"
                            icon={editIcon}
                            size="small"
                            onClick={() => navigate(`/Child_roster/${record.id}/edit`)}
                        />
                    </div>
                ),
            }
        ];

        return columns;
    }, [navigate, handleSort, getSortIcon, stateChildren.sendData.sort_by]);

    const tableData = useMemo(() => {
        if (data?.items?.length) {
            const result = data?.items?.map(el => {
                return {
                    key: el.id,
                    id: el.id,
                    child_name: el.child_name,
                    parent_name: el.parent_name,
                    phone: el.phone,
                    group_name: el.group_name,
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
                if (stateChildren.sendData.limit !== 16) {
                    setStateChildren(prevState => ({
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
                if (stateChildren.sendData.limit !== 32) {
                    setStateChildren(prevState => ({
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
                if (stateChildren.sendData.limit !== 48) {
                    setStateChildren(prevState => ({
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
        setStateChildren(prevState => ({
            ...prevState,
            isFilterOpen: !prevState.isFilterOpen,
        }))
    }

    const closeFilterDropdown = () => {
        setStateChildren(prevState => ({
            ...prevState,
            isFilterOpen: false,
        }))
    }

    const hasActiveFilters = useMemo(() => {
        return Object.values(stateChildren.selectData).some(value => {
            if (Array.isArray(value) && !value.length) {
                return false
            }
            return value !== null && value !== undefined && value !== ''
        })
    }, [stateChildren.selectData])

    const onHandleChange = (name, value) => {
        setStateChildren(prevState => ({
            ...prevState,
            selectData: {
                ...prevState.selectData,
                [name]: value
            }
        }))
    }

    const resetFilters = () => {
        setStateChildren(prevState => ({
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
        const isAnyInputFilled = Object.values(stateChildren.selectData).some(value => {
            if (Array.isArray(value) && !value.length) {
                return false
            }
            return value
        })
        
        if (isAnyInputFilled) {
            const dataValidation = validateFilters(stateChildren.selectData)
            if (!dataValidation.error) {
                const filterParams = {
                    ...stateChildren.selectData,
                    ...dataValidation
                }
                
                setStateChildren(prevState => ({
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
            setStateChildren(prevState => ({
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
        if (stateChildren.sendData.page !== page) {
            setStateChildren(prevState => ({
                ...prevState,
                sendData: {
                    ...prevState.sendData,
                    page,
                }
            }))
        }
    }, [stateChildren.sendData.page])

    const exportToExcel = async () => {
        try {
            const exportParams = {
                ...stateChildren.sendData,
                page: 1,
                limit: 10000,
                ...Object.fromEntries(
                    Object.entries(stateChildren.selectData).filter(([_, value]) => {
                        if (Array.isArray(value)) return value.length > 0;
                        return value !== null && value !== undefined && value !== '' && value !== false;
                    })
                )
            };

            const response = await fetch("/api/Child_roster/export", {
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
            const headers = ['ПІБ дитини', 'ПІБ батьків', 'Контактний номер телефону', 'Група'];
            excelData.push(headers);

            apiData.items.forEach(child => {
                const row = [
                    child.child_name || '',
                    child.parent_name || '',
                    child.phone || '',
                    child.group_name || ''
                ];
                excelData.push(row);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(excelData);
            
            const colWidths = [
                { wch: 25 }, // ПІБ дитини
                { wch: 25 }, // ПІБ батьків
                { wch: 20 }, // Контактний номер
                { wch: 20 }, // Група
            ];

            worksheet['!cols'] = colWidths;

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Реєстр дітей");

            const currentDate = new Date().toISOString().split('T')[0];
            const filterInfo = Object.keys(stateChildren.selectData).filter(key => stateChildren.selectData[key]).length > 0 
                ? '_filtered' 
                : '';
            
            const fileName = `реєстр_дітей_${currentDate}${filterInfo}.xlsx`;

            XLSX.writeFile(workbook, fileName);

            notification({
                type: "success",
                placement: "top",
                title: "Успіх",
                message: `Реєстр дітей успішно експортовано (${apiData.items.length} записів)`
            });

        } catch (error) {
            notification({
                type: "error",
                placement: "top",
                title: "Помилка",
                message: "Не вдалося експортувати реєстр дітей"
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
                                    caption={`Записів: ${stateChildren.sendData.limit}`}
                                    menu={itemMenu}/>
                                <Button
                                    className={`table-filter-trigger ${hasActiveFilters ? 'has-active-filters' : ''}`}
                                    onClick={filterHandleClick}
                                    icon={filterIcon}>
                                    Фільтри {hasActiveFilters && `(${Object.keys(stateChildren.selectData).filter(key => stateChildren.selectData[key]).length})`}
                                </Button>
                                <Button
                                    onClick={exportToExcel}
                                    icon={downloadIcon}>
                                    Завантажити
                                </Button>
                                <Button
                                    onClick={() => navigate('/Child_roster/create')}
                                    icon={addIcon}>
                                    Додати дитину
                                </Button>
                                <FilterDropdown
                                    isOpen={stateChildren.isFilterOpen}
                                    onClose={closeFilterDropdown}
                                    filterData={stateChildren.selectData}
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
                                    minWidth: data?.items?.length > 0 ? '950px' : 'auto'
                                }}>
                                    <Table columns={columnTable} dataSource={tableData}/>
                                </div>
                                <Pagination
                                    className="m-b"
                                    currentPage={parseInt(data?.currentPage) || 1}
                                    totalCount={data?.totalItems || 1}
                                    pageSize={stateChildren.sendData.limit}
                                    onPageChange={onPageChange}/>
                            </div>
                        </div>
                    </div>
                </React.Fragment> : null
            }
        </React.Fragment>
    )
};

export default ChildRoster;