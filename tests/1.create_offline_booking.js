var contactDetails = require('../data/testData').contactDetails
var merchant = require('../data/merchantSettings').nightwatchTest2
var moment = require('moment')
var momentTimezone = require('moment-timezone')
var functions = require('../functions.js')

module.exports={

    before: function (browser) {

        //Login to booking manager
        browser.resizeWindow(1280, 800);
        functions.login(browser, merchant.username, merchant.password)
        functions.clear_appointments(browser)

    },
 
    'create_offline_booking': function(browser){

        //Test Summary: click on a slot in the calendar, verify Date, time, staff, service. Select a customer
        //and save appointment. Verify appointment is displayed on the calendar and delete it.

        //Test data preparation
        let uniqueId = functions.generate_unique_id()               // we use time from 1970 to always get a unique email address
        let email = uniqueId + "@gmail.com"                         //we create dynamic email to avoid conflict with existing customer  
        let slotId= functions.find_slotId(merchant.businessHours.startTime, merchant.staff1Id, merchant.timezone)
        let todayDate = momentTimezone.tz(merchant.timezone).format('MMM DD, YYYY'); // e.g. "Apr 30, 2018"
        let service = merchant.service2                         //define what service from the merchant is being used in this test
        let serviceDuration = merchant.service2Duration         // see above
        let staff = merchant.staff1                             //define what staff from the merchant is being used in this test
        let note = "Unique booking Id = " + uniqueId
        let capFirstName = functions.capitalize_first_letter(contactDetails.firstName) //Booking form capitalise the first letter of customer's names
        let capLastName = functions.capitalize_first_letter(contactDetails.lastName) //Booking form capitalise the first letter of customer's names

        //Page objects creation
        var calendar = browser.page.calendar()
        var appointmentTab = browser.page.appointmentTab()
        var customerTab = browser.page.customerTab()

        //Open booking form by clicking on calendar slot
        calendar.waitAndClick('//div[@id="' + slotId + '"]', appointmentTab)
        functions.switch_iframe('bookingForm', browser)

        //Select a staff
        appointmentTab
            .expect.element('@staffDropDown').text.equal(merchant.staff1) //Default Staff
        appointmentTab
            .waitAndClick('@staffDropDown', browser)
            .click('//div[text()="' + staff + '"]')
            .expect.element('@staffDropDown').text.equal(staff)

        //Verify defaut Date picked is today's date
        appointmentTab.expect.element('@dateDropDown').to.have.attribute('value').equals(todayDate)

        //Verify default time is compliant with the slot selected
        appointmentTab.expect.element('@timeDropDown').text.to.equal(merchant.businessHours.startTime)

        //Verify default duration = 30 mins 
        appointmentTab.expect.element('@duration').to.have.attribute('value').equals("00:30")

        //Select service
        appointmentTab.click('@serviceDropDown')
        appointmentTab.expect.element('//span[text()="' + merchant.service1 + '"]').to.be.visible 
        appointmentTab.expect.element('//span[text()="' + merchant.service2 + '"]').to.be.visible 
        appointmentTab.click('//span[text()="' + service + '"]')
        appointmentTab.expect.element('//span[@class="service-name"]').text.to.equal(service)
        
        //Verify that Duration field has been updated according to service selected
        appointmentTab.expect.element('@duration').to.have.attribute('value').equals(serviceDuration)

        //Verify staff is selected
        appointmentTab.expect.element('//div[text()="' + staff + '"]').to.be.visible 

        //Enter customer details
        appointmentTab.click('@addCustomer')
        customerTab
            .waitForElementVisible('@firstName')
            .setValue('@firstName', contactDetails.firstName)
            .setValue('@lastName', contactDetails.lastName)
            .setValue('@email', email)
            .setValue('@phone', contactDetails.phone)
            .click('@save')
            .waitForElementVisible('//label[text()="Update customer record"]')
            .click('@back')

        //Verify correct customer is selected
        appointmentTab.expect.element('//div[@title="Customer"]/div[@class="default text"]/div').text.to.equal(capFirstName + " " + capLastName)
        appointmentTab.expect.element('@email').text.to.equals(email)
        appointmentTab.expect.element('@phone').text.to.equals(contactDetails.phone)

        //Add a note
        appointmentTab
            .waitAndClick('@memoBox', browser)
            .waitForElementVisible('@memoTextArea')
            .setValue('@memoTextArea', note)
            .expect.element('@memoTextArea').text.to.equal(note)

        //Save appointment 
        appointmentTab.click('@saveButton')

        //Verify Appointment is displayed on the calendar
        functions.switch_iframe("calendar", browser)
        calendar.waitForElementVisible('@appointmentSlotName')
        calendar.expect.element('@appointmentSlotName').text.to.equal(capFirstName + " " + capLastName)
        calendar.expect.element('@appointmentSlotService').text.to.equal(service)
        calendar.expect.element('@appointmentSlotPhone').text.to.equal(contactDetails.phone)
        calendar.expect.element('@appointmentSlotMemo').text.to.equal('"' + note + '"') //Calendar displays memo between quotes

        //Select appointment from calendar and delete.
        calendar.click("//div[@class='memoSummary'][text()='\"" + note + "\"']")
        functions.switch_iframe("bookingForm", browser)
        appointmentTab
            .waitForElementVisible('//span[@class="service-name"][text()="' + service + '"]')
            .click('@cancelAppointment')
            .expect.element('@cancelAppointmentConfirmation').text.to.contain("Confirm cancellation")
        appointmentTab
            .waitForElementVisible('@confirmationYes')
            .click('@confirmationYes')
        functions.switch_iframe("calendar", browser)
        calendar
            .waitForElementVisible('@addAppointment')
            .expect.element("//div[@class='memoSummary'][text()='\"" + note + "\"']").to.not.be.present

    },

    after: function (browser){
        browser.end();
    }
}

