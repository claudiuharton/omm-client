export interface Car {
    id: string
    carNumber: string,
    model: string,
    make: string,
    owner?: { email: string;[key: string]: any; } | null,
    isDeleted?: boolean,
    bookings: [],
    engineSize: string,
    dateOfManufacture: string,
    motExpiryDate?: string,
    tecDocKType: string,
    vin: string,

    // Additional fields from UKVD API for direct access
    colour?: string,
    fuelType?: string,
    transmission?: string,
    gearCount?: number,
    bodyStyle?: string,
    numberOfDoors?: number,
    numberOfSeats?: number,
    co2Emissions?: number,
    isElectricVehicle?: boolean,
    numberOfPreviousKeepers?: number,
    wheelBase?: number,
    vehicleLength?: number,
    vehicleWidth?: number,
    vehicleHeight?: number,
    unladenWeight?: number,
    fuelTankCapacity?: number,
    cylinderCapacity?: number,
    enginePowerBhp?: number,
    firstRegistered?: string,

    // Structured technical details
    technicalDetails?: {
        dimensions?: {
            unladenWeight?: number | null,
            rigidArtic?: string | null,
            bodyShape?: string | null,
            height?: number | null,
            numberOfDoors?: number | null,
            numberOfSeats?: number | null,
            kerbWeight?: number | null,
            fuelTankCapacity?: number | null,
            wheelBase?: number | null,
            carLength?: number | null,
            width?: number | null,
            numberOfAxles?: number | null,
            grossVehicleWeight?: number | null,
            grossCombinedWeight?: number | null
        } | null,
        engine?: {
            fuelCatalyst?: string | null,
            stroke?: number | null,
            valvesPerCylinder?: number | null,
            aspiration?: string | null,
            fuelSystem?: string | null,
            numberOfCylinders?: number | null,
            cylinderArrangement?: string | null,
            valveGear?: string | null,
            location?: string | null,
            description?: string | null,
            bore?: number | null,
            make?: string | null
        } | null,
        performance?: {
            torque?: {
                ftLb?: number | null,
                nm?: number | null,
                rpm?: number | null
            } | null,
            power?: {
                bhp?: number | null,
                rpm?: number | null,
                kw?: number | null
            } | null,
            maxSpeed?: {
                kph?: number | null,
                mph?: number | null
            } | null,
            co2?: number | null
        } | null,
        general?: {
            powerDelivery?: string | null,
            typeApprovalCategory?: string | null,
            seriesDescription?: string | null,
            driverPosition?: string | null,
            drivingAxle?: string | null,
            euroStatus?: string | null,
            isLimitedEdition?: boolean | null
        } | null,
        consumption?: {
            extraUrban?: {
                lkm?: number | null,
                mpg?: number | null
            } | null,
            urbanCold?: {
                lkm?: number | null,
                mpg?: number | null
            } | null,
            combined?: {
                lkm?: number | null,
                mpg?: number | null
            } | null
        } | null
    },

    // Structured vehicle history
    vehicleHistory?: {
        colourChangeCount?: number | null,
        financialInterestCount?: number | null,
        keeperChangesCount?: number | null,
        lastKeeperChangeDate?: string | null,
        lastV5CIssuedDate?: string | null,
        motTests?: any[] | null,
        v5CCount?: number | null,
        vehicleAgeInYears?: number | null,
        yearOfManufacture?: number | null
    },

    // Structured vehicle status
    vehicleStatus?: {
        motStatus?: string | null,
        motExpiryDate?: string | null,
        taxStatus?: string | null,
        taxDueDate?: string | null
    },

    // Additional detailed fields
    yearMonthFirstRegistered?: string,
    wheelPlan?: string,
    vehicleClass?: string,
    engineNumber?: string,
    grossWeight?: number,
    manufactureCountry?: string,
    euroEmissionStandard?: string,
    fuelConsumptionMpg?: number,

    // Full vehicle data structure
    vehicleData?: VehicleData,

    createdAt: string,
    updatedAt: string,
}

// Define the complete vehicle data structure
export interface VehicleData {
    UkvdEnhancedData?: {
        ElectricVehicleData?: unknown,
        Identification?: {
            IsElectricVehicle?: boolean
        }
    },
    TechnicalDetails?: {
        Dimensions?: {
            UnladenWeight?: number,
            RigidArtic?: string,
            BodyShape?: string,
            PayloadVolume?: number,
            PayloadWeight?: number,
            Height?: number,
            NumberOfDoors?: number,
            NumberOfSeats?: number,
            KerbWeight?: number,
            GrossTrainWeight?: number,
            FuelTankCapacity?: number,
            LoadLength?: number,
            DataVersionNumber?: number,
            WheelBase?: number,
            CarLength?: number,
            Width?: number,
            NumberOfAxles?: number,
            GrossVehicleWeight?: number,
            GrossCombinedWeight?: number
        },
        Safety?: {
            EuroNcap?: {
                Child?: number,
                Adult?: number,
                Pedestrian?: number
            }
        },
        General?: {
            Engine?: {
                FuelCatalyst?: string,
                Stroke?: number,
                PrimaryFuelFlag?: string,
                ValvesPerCylinder?: number,
                Aspiration?: string,
                FuelSystem?: string,
                NumberOfCylinders?: number,
                CylinderArrangement?: string,
                ValveGear?: string,
                Location?: string,
                Description?: string,
                Bore?: number,
                Make?: string,
                FuelDelivery?: string
            },
            PowerDelivery?: string,
            TypeApprovalCategory?: string,
            ElectricVehicleBattery?: {
                Capacity?: number,
                ChargePort?: string,
                ChargeTime?: number,
                Type?: string
            },
            SeriesDescription?: string,
            DriverPosition?: string,
            DrivingAxle?: string,
            DataVersionNumber?: number,
            EuroStatus?: string,
            IsLimitedEdition?: boolean
        },
        Performance?: {
            Torque?: {
                FtLb?: number,
                Nm?: number,
                Rpm?: number
            },
            NoiseLevel?: number,
            DataVersionNumber?: number,
            Power?: {
                Bhp?: number,
                Rpm?: number,
                Kw?: number
            },
            MaxSpeed?: {
                Kph?: number,
                Mph?: number
            },
            Co2?: number,
            Particles?: number,
            Acceleration?: {
                Mph?: number,
                Kph?: number,
                ZeroTo60Mph?: number,
                ZeroTo100Kph?: number
            }
        },
        Consumption?: {
            ExtraUrban?: {
                Lkm?: number,
                Mpg?: number
            },
            UrbanCold?: {
                Lkm?: number,
                Mpg?: number
            },
            Combined?: {
                Lkm?: number,
                Mpg?: number
            }
        }
    },
    ClassificationDetails?: {
        Smmt?: {
            Make?: string,
            Mvris?: {
                ModelCode?: string,
                MakeCode?: string
            },
            Trim?: string,
            Range?: string
        },
        Dvla?: {
            Model?: string,
            Make?: string,
            ModelCode?: string,
            MakeCode?: string
        },
        Ukvd?: {
            IsElectricVehicle?: boolean,
            VrmFormat?: {
                IsGbGeneralFormat?: boolean,
                IsNiGeneralFormat?: boolean
            },
            Uvc?: string
        }
    },
    VehicleStatus?: {
        MotVed?: {
            VedRate?: {
                FirstYear?: {
                    SixMonth?: number,
                    TwelveMonth?: number
                },
                PremiumVehicle?: {
                    YearTwoToSix?: {
                        TwelveMonth?: number,
                        SixMonth?: number
                    }
                },
                Standard?: {
                    SixMonth?: number,
                    TwelveMonth?: number
                }
            },
            VedCo2Emissions?: number,
            VedBand?: string,
            VedCo2Band?: string
        }
    },
    VehicleHistory?: {
        V5CCertificateCount?: number,
        PlateChangeCount?: number,
        NumberOfPreviousKeepers?: number,
        V5CCertificateList?: Array<{
            CertificateDate?: string
        }>,
        KeeperChangesCount?: number,
        VicCount?: number,
        ColourChangeCount?: number,
        ColourChangeList?: unknown,
        KeeperChangesList?: Array<{
            DateOfTransaction?: string,
            NumberOfPreviousKeepers?: number,
            DateOfLastKeeperChange?: string
        }>,
        PlateChangeList?: unknown[],
        VicList?: unknown,
        ColourChangeDetails?: {
            CurrentColour?: string,
            NumberOfPreviousColours?: number,
            OriginalColour?: string,
            LastColour?: string,
            DateOfLastColourChange?: string
        }
    },
    VehicleRegistration?: {
        DateOfLastUpdate?: string,
        Colour?: string,
        VehicleClass?: string,
        CertificateOfDestructionIssued?: boolean,
        EngineNumber?: string,
        EngineCapacity?: string,
        TransmissionCode?: string,
        Exported?: boolean,
        YearOfManufacture?: string,
        WheelPlan?: string,
        DateExported?: string,
        Scrapped?: boolean,
        Transmission?: string,
        DateFirstRegisteredUk?: string,
        Model?: string,
        GearCount?: number,
        ImportNonEu?: boolean,
        PreviousVrmGb?: string,
        GrossWeight?: number,
        DoorPlanLiteral?: string,
        MvrisModelCode?: string,
        Vin?: string,
        Vrm?: string,
        DateFirstRegistered?: string,
        DateScrapped?: string,
        DoorPlan?: string,
        YearMonthFirstRegistered?: string,
        VinLast5?: string,
        VehicleUsedBeforeFirstRegistration?: boolean,
        MaxPermissibleMass?: number,
        Make?: string,
        MakeModel?: string,
        TransmissionType?: string,
        SeatingCapacity?: number,
        FuelType?: string,
        Co2Emissions?: number,
        Imported?: boolean,
        MvrisMakeCode?: string,
        PreviousVrmNi?: string,
        VinConfirmationFlag?: string,
        DtpMakeCode?: string,
        DtpModelCode?: string
    },
    SmmtDetails?: {
        Range?: string,
        FuelType?: string,
        EngineCapacity?: string,
        MarketSectorCode?: string,
        CountryOfOrigin?: string,
        ModelCode?: string,
        ModelVariant?: string,
        DataVersionNumber?: number,
        NumberOfGears?: number,
        NominalEngineCapacity?: number,
        MarqueCode?: string,
        Transmission?: string,
        BodyStyle?: string,
        VisibilityDate?: string,
        SysSetupDate?: string,
        Marque?: string,
        CabType?: string,
        TerminateDate?: string,
        Series?: string,
        NumberOfDoors?: number,
        DriveType?: string
    }
}

export interface CarResponse {
    success: boolean;
    message: string;
    responseObject: Car[];
}
